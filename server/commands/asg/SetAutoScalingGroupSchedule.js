/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let _ = require('lodash');
let co = require('co');
let AsgResource = require('modules/resourceFactories/AsgResource');

// TODO: Check redundant escapes in regex (eslint no-useless-escape)
let SCHEDULE_PATTERN = /^(NOSCHEDULE\s+)?((247|OFF|on|on6)|(((Start|Stop): [\d\,\-\*\\]+ [\d\,\-\*\\]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+\s?[\d\,\-\*]*)(\s*\;?\s+|$))+)?(\s*NOSCHEDULE)?(\s*|.*)?$/i;
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');
let ec2InstanceClientFactory = require('modules/clientFactories/ec2InstanceClientFactory');

module.exports = function SetAutoScalingGroupScheduleCommandHandler({ autoScalingGroupName, environmentName, propagateToInstances, schedule: newSchedule }) {
  assert(autoScalingGroupName !== undefined, 'autoScalingGroupName is required');
  assert(environmentName !== undefined, 'environmentName is required');
  assert(newSchedule !== undefined, 'newSchedule is required');

  return co(function* () {
    let scalingSchedule;
    let schedule;
    if (_.isArray(newSchedule)) {
      scalingSchedule = newSchedule;
      schedule = 'NOSCHEDULE';
    } else {
      scalingSchedule = [];
      schedule = newSchedule;
    }

    if (!SCHEDULE_PATTERN.test(newSchedule)) {
      return Promise.reject(new InvalidOperationError(
        `Provided schedule is invalid. Current value: "${schedule}".`
      ));
    }

    let result = {
      ChangedAutoScalingGroups: undefined,
      ChangedInstances: undefined
    };

    result.ChangedAutoScalingGroups = yield setAutoScalingGroupSchedule(
      autoScalingGroupName,
      schedule,
      scalingSchedule,
      environmentName
    );

    if (propagateToInstances) {
      let autoScalingGroup = yield AsgResource.get({ environmentName, name: autoScalingGroupName });
      let instanceIds = autoScalingGroup.Instances.map(instance => instance.InstanceId);

      result.ChangedInstances = yield setEC2InstancesScheduleTag(
        instanceIds,
        schedule,
        environmentName
      );
    }

    return result;
  });
};

function setAutoScalingGroupSchedule(autoScalingGroupName, schedule, scalingSchedule, environmentName) {
  let setScheduleTask = setAutoScalingGroupScalingSchedule(autoScalingGroupName, scalingSchedule, environmentName);
  let setTagsTask = setAutoScalingGroupScheduleTag(autoScalingGroupName, schedule, environmentName);

  return Promise
    .all([setScheduleTask, setTagsTask])
    .then(() => [autoScalingGroupName]);
}

function setAutoScalingGroupScheduleTag(autoScalingGroupName, schedule, environmentName) {
  let parameters = {
    environmentName,
    name: autoScalingGroupName,
    tagKey: 'Schedule',
    tagValue: schedule
  };

  return AsgResource.setTag(parameters);
}

function setAutoScalingGroupScalingSchedule(autoScalingGroupName, newScheduledActions, environmentName) {
  return co(function* () {
    let existingScheduledActions = yield getScheduledActions(autoScalingGroupName, environmentName);
    yield existingScheduledActions.map(action => deleteScheduledAction(action, environmentName));

    if (!(newScheduledActions instanceof Array)) return Promise.resolve();

    return yield newScheduledActions.map((action, index) => {
      let namedAction = {
        environmentName,
        AutoScalingGroupName: autoScalingGroupName,
        ScheduledActionName: `EM-Scheduled-Action-${index + 1}`,
        MinSize: action.MinSize,
        MaxSize: action.MaxSize,
        DesiredCapacity: action.DesiredCapacity,
        Recurrence: action.Recurrence
      };
      return AsgResource.createScheduledAction(namedAction);
    });
  });
}

function getScheduledActions(autoScalingGroupName, environmentName) {
  let parameters = {
    environmentName,
    AutoScalingGroupName: autoScalingGroupName
  };
  return AsgResource.describeScheduledActions(parameters);
}

function deleteScheduledAction(action, environmentName) {
  let parameters = {
    environmentName,
    AutoScalingGroupName: action.AutoScalingGroupName,
    ScheduledActionName: action.ScheduledActionName
  };
  return AsgResource.deleteScheduledAction(parameters);
}

function setEC2InstancesScheduleTag(instanceIds, schedule, environmentName) {
  if (!instanceIds.length) return Promise.resolve();
  let params = {
    environmentName,
    instanceIds,
    tagKey: 'Schedule',
    tagValue: schedule
  };
  return ec2InstanceClientFactory.setTag(params)
    .then(() => instanceIds);
}
