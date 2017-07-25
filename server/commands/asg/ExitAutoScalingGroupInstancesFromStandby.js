/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let AsgResource = require('modules/resourceFactories/AsgResource');
let co = require('co');
let SetAutoScalingGroupSize = require('commands/asg/SetAutoScalingGroupSize');
let autoScalingGroupSizePredictor = require('modules/autoScalingGroupSizePredictor');

module.exports = function ExitAutoScalingGroupInstancesFromStandby({ autoScalingGroupName, environmentName, instanceIds }) {
  assert(environmentName !== undefined && environmentName !== null);
  assert(autoScalingGroupName !== undefined && autoScalingGroupName !== null);
  assert(instanceIds !== undefined && instanceIds !== null);

  return co(function* () {
    let autoScalingGroup = yield AsgResource.get({ environmentName, name: autoScalingGroupName });

    // Predict AutoScalingGroup size after exiting instances from standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instanceIds);

    // Create a resource to work with AutoScalingGroups in the target AWS account.

    // Before exiting instances from Standby the AutoScalingGroup maximum size has to be
    // increased because the action of "exiting instances from standby" will automatically
    // increase the desired capacity and this cannot be greater than the maximum size.
    let increaseMaxSize = {
      environmentName,
      autoScalingGroupName,
      autoScalingGroupMaxSize: expectedSize
    };
    yield SetAutoScalingGroupSize(increaseMaxSize);

    // Through the resource instance previously created the AutoScalingGroup instances
    // are exited from standby
    let parameters = {
      environmentName,
      name: autoScalingGroupName,
      instanceIds
    };
    yield AsgResource.exitInstancesFromStandby(parameters);

    // After exiting instances from Standby the AutoScalingGroup minimum size should be
    // increased as well as the maximum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    let increaseMinSize = {
      environmentName,
      autoScalingGroupName,
      autoScalingGroupMinSize: expectedSize
    };
    yield SetAutoScalingGroupSize(increaseMinSize);

    return { InstancesExitedFromStandby: instanceIds };
  });
};
