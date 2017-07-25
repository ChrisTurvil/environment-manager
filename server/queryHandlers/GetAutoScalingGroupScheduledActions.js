/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let { getPartitionForEnvironment } = require('modules/amazon-client/awsPartitions');
let AsgScheduledActionsResource = require('modules/resourceFactories/AsgScheduledActionsResource');
let { createASGClient } = require('modules/amazon-client/childAccountClient');

function GetAutoScalingGroupScheduledActions({ autoScalingGroupName, environmentName }) {
  assert(environmentName);
  assert(autoScalingGroupName);

  return getPartitionForEnvironment(environmentName)
    .then(({ accountId, region }) => createASGClient(accountId, region))
    .then(client => new AsgScheduledActionsResource(client))
    .then(resource => resource.get({ name: autoScalingGroupName }));
}

module.exports = GetAutoScalingGroupScheduledActions;
