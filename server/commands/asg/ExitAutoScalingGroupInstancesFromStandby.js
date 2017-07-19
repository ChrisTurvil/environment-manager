/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let sender = require('modules/sender');
let autoScalingGroupSizePredictor = require('modules/autoScalingGroupSizePredictor');
let AutoScalingGroup = require('models/AutoScalingGroup');
let AsgResource = require('modules/resourceFactories/AsgResource');

module.exports = function ExitAutoScalingGroupInstancesFromStandby(command) {
  assert(command.partition !== undefined && command.partition !== null);
  assert(command.autoScalingGroupName !== undefined && command.autoScalingGroupName !== null);
  assert(command.instanceIds !== undefined && command.instanceIds !== null);

  return co(function* () {
    let parameters;
    let childCommand;

    let autoScalingGroup = yield AutoScalingGroup.getByName(command.partition, command.autoScalingGroupName);

    // Predict AutoScalingGroup size after exiting instances from standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, command.instanceIds);

    // Create a resource to work with AutoScalingGroups in the target AWS account.
    let asgResource = new AsgResource(command.partition);

    // Before exiting instances from Standby the AutoScalingGroup maximum size has to be
    // increased because the action of "exiting instances from standby" will automatically
    // increase the desired capacity and this cannot be greater than the maximum size.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      partition: command.partition,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMaxSize: expectedSize
    };
    yield sender.sendCommand({ command: childCommand, parent: command });

    // Through the resource instance previously created the AutoScalingGroup instances
    // are exited from standby
    parameters = {
      name: command.autoScalingGroupName,
      instanceIds: command.instanceIds
    };
    yield asgResource.exitInstancesFromStandby(parameters);

    // After exiting instances from Standby the AutoScalingGroup minimum size should be
    // increased as well as the maximum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      partition: command.partition,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMinSize: expectedSize
    };
    yield sender.sendCommand({ command: childCommand, parent: command });

    return { InstancesExitedFromStandby: command.instanceIds };
  });
};
