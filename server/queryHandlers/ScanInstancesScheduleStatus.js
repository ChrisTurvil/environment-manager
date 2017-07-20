/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
let scheduling = require('modules/scheduling');
let opsEnvironment = require('modules/data-access/opsEnvironment');
let ScanAutoScalingGroups = require('queryHandlers/ScanAutoScalingGroups');
let ScanInstances = require('queryHandlers/ScanInstances');

module.exports = function ScanInstancesScheduleStatusQueryHandler(query) {
  return co(function* () { // eslint-disable-line func-names
    let instances = yield getInstances(query);

    let dateTime = query.dateTime ? query.dateTime : new Date();
    return scheduledActionsForInstances(instances, dateTime);
  });
};

function getInstances(query) {
  return Promise.all([getAllInstances(query), getAllEnvironments(query), getAllASGs(query)]).then((data) => {
    let allInstances = data[0];
    let environments = buildEnvironmentIndex(data[1]);
    let asgs = buildASGIndex(data[2]);

    let instances = [];

    allInstances.forEach((instance) => {
      let environmentName = getInstanceTagValue(instance, 'environment');

      if (environmentName) {
        instance.Environment = findInIndex(environments, environmentName.toLowerCase());
      }

      let asgName = getInstanceTagValue(instance, 'aws:autoscaling:groupName');
      instance.AutoScalingGroup = findInIndex(asgs, asgName);

      instances.push(instance);
    });

    return instances;
  });
}

function scheduledActionsForInstances(instances, dateTime) {
  return instances.map((instance) => {
    let action = scheduling.actionForInstance(instance, dateTime);
    let instanceVM = {
      id: instance.InstanceId,
      name: getInstanceTagValue(instance, 'name'),
      role: getInstanceTagValue(instance, 'role'),
      environment: getInstanceTagValue(instance, 'environment')
    };

    if (instance.AutoScalingGroup) {
      instanceVM.asg = instance.AutoScalingGroup.AutoScalingGroupName;
    }

    return { action, instance: instanceVM };
  });
}

function buildEnvironmentIndex(environmentData) {
  let environments = {};

  environmentData.forEach((env) => {
    let environment = env.Value;
    environment.Name = env.EnvironmentName.toLowerCase();
    environments[environment.Name] = environment;
  });

  return environments;
}

function buildASGIndex(asgData) {
  let asgs = {};

  asgData.forEach((asg) => {
    asgs[asg.AutoScalingGroupName] = asg;
  });

  return asgs;
}

function findInIndex(map, name) {
  return name ? map[name] : undefined;
}

function getInstanceTagValue(instance, tagName) {
  let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
  return tag ? tag.Value : undefined;
}

function getAllInstances(query) {
  return ScanInstances(query);
}

function getAllEnvironments(query) {
  return opsEnvironment.scan();
}

function getAllASGs(query) {
  return ScanAutoScalingGroups(query);
}
