/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let ms = require('ms');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let AsgResource = require('modules/resourceFactories/AsgResource');

module.exports = function CreateAutoScalingGroupCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  let {
    environmentName,
    template
  } = command;

  assert(command, 'Expected "command" argument not to be null.');
  assert(template, 'Expected "command" argument to contain "template" property not null.');
  assert(environmentName, 'Expected "command" argument to contain "accountName" property not null or empty.');

  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;

    logger.info(`Creating [${autoScalingGroupName}] AutoScalingGroup...`);

    let request = getCreateAutoScalingGroupRequest(template);
    yield createAutoScalingGroup(logger, environmentName, request);

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been created`);
    logger.info(`Configuring [${autoScalingGroupName}] AutoScalingGroup...`);

    yield [
      attachNotificationsByTemplate(logger, environmentName, template),
      attachLifecycleHooksByTemplate(logger, environmentName, template)
    ];

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been configured`);
  });
};

function attachNotificationsByTemplate(logger, environmentName, template) {
  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;
    let requests = getAttachNotificationsRequests(template);

    if (!requests.length) {
      logger.info(`No [${autoScalingGroupName}] AutoScalingGroup notification has to be attached to any SNS topic`);
      return;
    }

    logger.info(`Attaching [${autoScalingGroupName}] AutoScalingGroup notifications to SNS topics...`);

    yield requests.map(request => attachNotifications(environmentName, request));

    logger.info(`All [${autoScalingGroupName}] AutoScalingGroup notifications have been attached to SNS topics`);
  });
}

function attachLifecycleHooksByTemplate(logger, environmentName, template) {
  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;
    let requests = getAttachLifecycleHookRequests(template);

    if (!requests.length) {
      logger.info(`No lifecycle hook has to be attached to [${autoScalingGroupName}] AutoScalingGroup`);
      return;
    }

    logger.info(`Attaching lifecycle hooks to [${autoScalingGroupName}] AutoScalingGroup...`);

    yield requests.map(request => attachLifecycleHook(environmentName, request));

    logger.info(`All lifecycle hooks have been attached to [${autoScalingGroupName}] AutoScalingGroup`);
  });
}

// ----------------------------------------------------------------------------------------------
// Functions to promisify [autoScalingGroupClient] interface

function createAutoScalingGroup(logger, environmentName, request) {
  return AsgResource.post(Object.assign({ environmentName }, request));
}

function attachNotifications(environmentName, request) {
  return AsgResource.attachNotifications(Object.assign({ environmentName }, request));
}

function attachLifecycleHook(environmentName, request) {
  return AsgResource.attachLifecycleHook(Object.assign({ environmentName }, request));
}

// ----------------------------------------------------------------------------------------------
// Functions to create requests understandable to AWS AutoScaling APIs

function getCreateAutoScalingGroupRequest(template) {
  let request = {
    AutoScalingGroupName: template.autoScalingGroupName,
    LaunchConfigurationName: template.launchConfigurationName,
    MaxSize: template.size.max,
    MinSize: template.size.min,
    VPCZoneIdentifier: template.subnets.join(','),
    DesiredCapacity: template.size.desired,
    Tags: getAutoScalingGroupTags(template.tags)
  };

  return request;
}

function getAutoScalingGroupTags(tags) {
  let autoScalingGroupTags = [];
  for (let tag in tags) {
    if ({}.hasOwnProperty.call(tags, tag)) {
      autoScalingGroupTags.push({
        Key: tag,
        Value: tags[tag]
      });
    }
  }

  return autoScalingGroupTags;
}

function getAttachNotificationsRequests(template) {
  let requests = template.topicNotificationMapping.map((mapping) => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      TopicARN: mapping.topicArn,
      NotificationTypes: mapping.notificationTypes
    };

    return request;
  });

  return requests;
}

function getAttachLifecycleHookRequests(template) {
  let requests = template.lifecycleHooks.map((hook) => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      LifecycleHookName: hook.name,
      LifecycleTransition: hook.type,
      RoleARN: hook.roleArn,
      NotificationTargetARN: hook.topicArn,
      HeartbeatTimeout: (ms(hook.heartbeatTimeout) / 1000),
      DefaultResult: hook.defaultResult
    };

    return request;
  });

  return requests;
}
