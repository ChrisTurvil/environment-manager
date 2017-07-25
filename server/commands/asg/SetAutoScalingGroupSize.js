/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let _ = require('lodash');
let AsgResource = require('modules/resourceFactories/AsgResource');
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');

function* handler({
  autoScalingGroupDesiredSize: desired,
  autoScalingGroupMaxSize: max,
  autoScalingGroupMinSize: min,
  autoScalingGroupName,
  environmentName
}) {
  assert(autoScalingGroupName !== undefined);
  assert(environmentName !== undefined);

  if (!_.isNil(min)) {
    if (!_.isNil(max) && min > max) {
      throw new InvalidOperationError(
        `Provided Max size '${max}' must be greater than or equal to the Min size '${min}'.`
      );
    }

    if (!_.isNil(desired) && desired < min) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be greater than or equal to the Min size '${min}'.`
      );
    }
  }

  if (!_.isNil(max)) {
    if (!_.isNil(min) && min > max) {
      throw new InvalidOperationError(
        `Provided Min size '${min}' must be less than or equal to the Max size '${max}'.`
      );
    }

    if (!_.isNil(desired) && desired > max) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be less than or equal to the Max size '${max}'.`
      );
    }
  }

  // Change the AutoScalingGroup size accordingly to the expected one.
  let parameters = {
    environmentName,
    name: autoScalingGroupName,
    minSize: min,
    desiredSize: desired,
    maxSize: max
  };

  return AsgResource.put(parameters);
}

module.exports = co.wrap(handler);
