/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let {
  getPartitionForEnvironment
} = require('modules/amazon-client/awsPartitions');
let { createASGClient } = require('modules/amazon-client/childAccountClient');
let AwsError = require('modules/errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('modules/errors/AutoScalingGroupNotFoundError.class');
let AutoScalingGroupAlreadyExistsError = require('modules/errors/AutoScalingGroupAlreadyExistsError.class');
let cacheManager = require('modules/cacheManager');
let fp = require('lodash/fp');
let logger = require('modules/logger');
let pages = require('modules/amazon-client/pages');
let { hasTag } = require('modules/awsTags');
let AutoScalingGroup = require('models/AutoScalingGroup');

let {
  clear: clearAsgsFromCache,
  get: getAsgsFromCache
} =
  (() => {
    function getAllAsgsInPartition(cacheKey) {
      let { accountId, region } = JSON.parse(cacheKey);
      logger.debug(`Describing all ASGs in region ${region} in account ${accountId}...`);
      return createASGClient(accountId, region)
        .then(client => pages.flatten(page => page.AutoScalingGroups, client.describeAutoScalingGroups()))
        .then(fp.flatten);
    }

    let asgCache = cacheManager.create('Auto Scaling Groups', getAllAsgsInPartition, { stdTTL: 60 });

    return {
      clear({ accountId, region }) {
        let cacheKey = JSON.stringify({ accountId, region });
        return asgCache.del(cacheKey);
      },
      get({ accountId, region }) {
        let cacheKey = JSON.stringify({ accountId, region });
        return asgCache.get(cacheKey);
      }
    };
  })();

function asgClientForEnvironment(environmentName) {
  return getPartitionForEnvironment(environmentName)
    .then(({ accountId, region }) => createASGClient(accountId, region));
}

function AsgResource() {
  function standardifyError(error, autoScalingGroupName) {
    if (!error) return null;
    let awsError = new AwsError(error.message);
    if (error.message.indexOf('AutoScalingGroup name not found') >= 0) {
      return new AutoScalingGroupNotFoundError(`AutoScalingGroup "${autoScalingGroupName}" not found.`, awsError);
    }

    if (error.code === 'AlreadyExists') {
      let message = `AutoScalingGroup "${autoScalingGroupName}" already exists.`;
      return new AutoScalingGroupAlreadyExistsError(message, awsError);
    }

    return awsError;
  }

  function describeAutoScalingGroups({ accountId, region, names }) {
    let predicate = (() => {
      if (names && names.length) {
        let nameSet = new Set(names);
        return asg => nameSet.has(asg.AutoScalingGroupName);
      } else {
        return () => true;
      }
    })();

    return getAsgsFromCache({ accountId, region }).then(fp.flow(fp.filter(predicate), fp.map(asg => new AutoScalingGroup(asg))));
  }

  this.get = function ({ clearCache = false, environmentName, name }) {
    assert(environmentName, 'environmentName is required');
    assert(name, 'name is required');
    return getPartitionForEnvironment(environmentName)
      .then(({ accountId, region }) => {
        if (clearCache === true) {
          clearAsgsFromCache({ accountId, region });
        }
        return { accountId, region };
      })
      .then(partition => describeAutoScalingGroups(partition, [name]))
      .then((result) => {
        if (result.length > 0) return result[0];
        throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${name}" not found.`);
      }).catch((error) => {
        throw new AwsError(error.message);
      });
  };

  this.all = function ({ accountId, region, names }) {
    return describeAutoScalingGroups({ accountId, region }, names);
  };

  this.setTag = function ({ environmentName, name, tagKey, tagValue }) {
    let request = {
      Tags: [{
        Key: tagKey,
        PropagateAtLaunch: true,
        ResourceId: name,
        ResourceType: 'auto-scaling-group',
        Value: tagValue
      }]
    };
    return asgClientForEnvironment(environmentName)
      .then(client => client.createOrUpdateTags(request).promise())
      .catch((error) => {
        throw standardifyError(error, name);
      });
  };

  this.delete = function ({ environmentName, name, force }) {
    logger.warn(`Deleting Auto Scaling Group "${name}"`);
    return asgClientForEnvironment(environmentName)
      .then(client => client.deleteAutoScalingGroup({ AutoScalingGroupName: name, ForceDelete: force }).promise());
  };

  this.put = function (parameters) {
    let request = fp.omitBy(fp.isNil)({
      AutoScalingGroupName: parameters.name,
      MinSize: parameters.minSize,
      DesiredCapacity: parameters.desiredSize,
      MaxSize: parameters.maxSize,
      LaunchConfigurationName: parameters.launchConfigurationName,
      VPCZoneIdentifier: parameters.subnets.join(',')
    });

    return getPartitionForEnvironment(parameters.environmentName)
      .then((partition) => {
        let { accountId, region } = partition;
        clearAsgsFromCache({ accountId, region });
        return partition;
      })
      .then(({ accountId, region }) => createASGClient(accountId, region))
      .then(client => client.updateAutoScalingGroup(request).promise())
      .catch((error) => {
        throw standardifyError(error, parameters.name);
      });
  };

  this.enterInstancesToStandby = ({ environmentName, instanceIds, name }) => {
    let request = {
      AutoScalingGroupName: name,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: instanceIds
    };
    return asgClientForEnvironment(environmentName)
      .then(client => client.enterStandby(request).promise());
  };

  this.exitInstancesFromStandby = ({ environmentName, instanceIds, name }) => {
    let request = {
      AutoScalingGroupName: name,
      InstanceIds: instanceIds
    };
    return asgClientForEnvironment(environmentName)
      .then(client => client.exitStandby(request).promise());
  };

  this.post = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.createAutoScalingGroup(fp.omit('environmentName')(request)).promise())
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.attachNotifications = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.putNotificationConfiguration(fp.omit('environmentName')(request)).promise())
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.attachLifecycleHook = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.putLifecycleHook(fp.omit('environmentName')(request)).promise())
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.describeScheduledActions = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.describeScheduledActions(fp.omit('environmentName')(request)).promise())
      .then(result => result.ScheduledUpdateGroupActions)
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.deleteScheduledAction = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.deleteScheduledAction(fp.omit('environmentName')(request)).promise())
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.createScheduledAction = request =>
    asgClientForEnvironment(request.environmentName)
      .then(client => client.putScheduledUpdateGroupAction(fp.omit('environmentName')(request)).promise())
      .catch((error) => {
        throw standardifyError(error, request.AutoScalingGroupName);
      });

  this.getAllByEnvironment = ({ environmentName }) => getPartitionForEnvironment(environmentName)
    .then(({ accountId, region }) => getAsgsFromCache({ accountId, region }))
    .then(fp.filter(hasTag('Environment', x => x === environmentName)))
    .then(fp.map(asg => new AutoScalingGroup(asg)));

  this.getAllByServerRoleName = ({ environmentName, serverRoleName }) => getPartitionForEnvironment(environmentName)
    .then(({ accountId, region }) => getAsgsFromCache({ accountId, region }))
    .then(fp.filter(asg => hasTag('Environment', x => x === environmentName)(asg)
      && hasTag('Role', x => x === serverRoleName)(asg)))
    .then(fp.map(asg => new AutoScalingGroup(asg)));
}

module.exports = new AsgResource();
