/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let AsgResource = require('modules/resourceFactories/AsgResource');
let SetAutoScalingGroupSize = require('commands/asg/SetAutoScalingGroupSize');
let autoScalingGroupSizePredictor = require('modules/autoScalingGroupSizePredictor');

module.exports = function EnterAutoScalingGroupInstancesToStandbyCommandHandler({ autoScalingGroupName, environmentName, instanceIds }) {
  assert(environmentName, 'Expected "command" argument to contain "environmentName" property not null or empty.');
  assert(autoScalingGroupName, 'Expected "command" argument to contain "autoScalingGroupName" property not null or empty.');
  assert(instanceIds, 'Expected "command" argument to contain "instanceIds" property not null or empty.');

  return co(function* () {
    // Send a query to obtain the AutoScalingGroup information.
    let autoScalingGroup = yield AsgResource.get({ environmentName, name: autoScalingGroupName });

    // Predict AutoScalingGroup size after entering instances to standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterEnteringInstancesToStandby(
      autoScalingGroup,
      instanceIds);

    // Before entering instances to Standby the AutoScalingGroup minimum size has to be
    // reduced because the action of "entering instances to standby" will automatically
    // reduce the desired capacity and this cannot be less than the minimum size.
    yield setAutoScalingGroupSize({ min: expectedSize }, { autoScalingGroupName, environmentName });

    // Through the resource instance previously created the AutoScalingGroup instances
    // are entered to standby
    yield AsgResource.enterInstancesToStandby({
      environmentName,
      name: autoScalingGroupName,
      instanceIds
    });

    // After entering instances to Standby the AutoScalingGroup maximum size should be
    // reduced as well as the minimum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    yield setAutoScalingGroupSize({ max: expectedSize }, { autoScalingGroupName, environmentName });

    return {
      InstancesEnteredToStandby: instanceIds
    };
  });
};

function setAutoScalingGroupSize(size, { autoScalingGroupName, environmentName }) {
  let command = {
    environmentName,
    autoScalingGroupName,
    autoScalingGroupMinSize: size.min,
    autoScalingGroupMaxSize: size.max
  };

  return SetAutoScalingGroupSize(command);
}
