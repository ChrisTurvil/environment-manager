/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let moment = require('moment');
let co = require('co');
let sender = require('modules/sender');
let EnvironmentType = require('models/EnvironmentType');
let Environment = require('models/Environment');
let serviceTargets = require('modules/service-targets');
let resourceProvider = require('modules/resourceProvider');
let logger = require('modules/logger');
let TaggableMixin = require('./TaggableMixin');
let AsgResource = require('modules/resourceFactories/AsgResource');
let { getPartitionsForEnvironment } = require('modules/amazon-client/awsConfiguration');
let { create: }

class AutoScalingGroup {

  constructor(data) {
    _.assign(this, data);
  }

  getLaunchConfiguration() {
    let self = this;
    return co(function* () {
      let name = self.LaunchConfigurationName;
      if (name === undefined) {
        throw new Error(`Launch configuration doesn't exist for ${self.AutoScalingGroupName}`);
      }
      let client = yield resourceProvider.getInstanceByName('launchconfig', { partition });
      return client.get({ name });
    });
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.getTag('EnvironmentType'));
  }

  getRuntimeServerRoleName() {
    return this.getTag('Role');
  }

  deleteASG() {
    let environmentName = this.getTag('Environment');
    let self = this;
    return co(function* () {
      let partition = yield getPartitionsForEnvironment(environmentName);
      let asgResource = new AsgResource(partition);
      let launchConfigResource = yield resourceProvider.getInstanceByName('launchconfig', { partition });
      logger.info(`Deleting AutoScalingGroup ${self.AutoScalingGroupName} and associated Launch configuration ${self.LaunchConfigurationName}`);

      yield asgResource.delete({ name: self.AutoScalingGroupName, force: true });
      if (self.LaunchConfigurationName !== undefined) {
        // If not present it means that this ASG is already being deleted
        yield launchConfigResource.delete({ name: self.LaunchConfigurationName });
      }

      yield serviceTargets.removeRuntimeServerRoleTargetState(environmentName, self.getRuntimeServerRoleName());
      return true;
    });
  }

  static getAllByServerRoleName(environmentName, serverRoleName) {
    return AutoScalingGroup.getAllByEnvironment(environmentName)
      .then(asgs => _.filter(asgs, asg => asg.getTag('Role') === serverRoleName));
  }

  static getByName(partition, autoScalingGroupName) {
    return co(function* () {
      let query = {
        name: 'GetAutoScalingGroup',
        partition,
        autoScalingGroupName
      };

      let data = yield sender.sendQuery({ query });
      data.$partition = partition;
      data.$autoScalingGroupName = autoScalingGroupName;
      return data;
    });
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let partition = yield getPartitionsForEnvironment(environmentName);
      let startTime = moment.utc();

      return sender.sendQuery({
        query: {
          name: 'ScanAutoScalingGroups',
          partition
        }
      }).then((result) => {
        let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
        logger.debug(`server-status-query: AllAsgsQuery took ${duration}ms`);
        return _.filter(result, asg => asg.getTag('Environment', '') === environmentName);
      });
    });
  }

}

module.exports = TaggableMixin(AutoScalingGroup);
