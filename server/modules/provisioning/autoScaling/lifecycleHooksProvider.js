/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let LifecycleHookType = require('Enums').LifecycleHookType;
let LifecycleHookDefaultResult = require('Enums').LifecycleHookDefaultResult;
let GetRole = require('queryHandlers/GetRole');
let GetTopic = require('queryHandlers/GetTopic');

module.exports = {
  get(accountName) {
    return co(function* () {
      let role = yield getRoleByName('roleInfraAsgScale', accountName);
      let topic = yield getTopicByName('InfraAsgLambdaScale', accountName);

      return [{
        name: '10min-draining',
        type: LifecycleHookType.InstanceTerminating,
        roleArn: role.Arn,
        topicArn: topic.TopicArn,
        defaultResult: LifecycleHookDefaultResult.Continue,
        heartbeatTimeout: '10m'
      }];
    });
  }
};

function getRoleByName(roleName, accountName) {
  return GetRole({ accountName, roleName });
}

function getTopicByName(topicName, accountName) {
  return GetTopic({ accountName, topicName });
}
