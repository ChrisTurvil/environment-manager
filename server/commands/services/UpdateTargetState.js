/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');

module.exports = function UpdateTargetState({ deploymentId, environment, key, options, value }) {
  let logger = new DeploymentCommandHandlerLogger(deploymentId);

  return co(function* () {
    logger.info(`Updating key ${key}`);
    return yield serviceTargets.setTargetState(environment, { key, value, options });
  });
};
