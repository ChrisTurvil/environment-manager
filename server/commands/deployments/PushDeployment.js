/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let consulClient = require('modules/consul-client');
let serverRoleProvider = require('modules/deployment/serverRoleDefinition');
let serviceInstallationProvider = require('modules/deployment/serviceInstallationDefinition');
let serviceDefinitionProvider = require('modules/deployment/serviceDefinition');
let serviceDeploymentProvider = require('modules/deployment/serviceDeploymentDefinition');
let deploymentDefinitionProvider = require('modules/deployment/deploymentDefinition');
let UpdateTargetState = require('commands/services/UpdateTargetState');

module.exports = function PushDeploymentCommandHandler({
  deployment,
  expectedNodeDeployments,
  s3Path
}) {
  const logger = new DeploymentCommandHandlerLogger(deployment);

  return co(function* () {
    let consulConfig = yield consulClient.createConfig({ environment: deployment.environmentName });
    let dataCentre = consulConfig.defaults.dc;

    logger.info(`Updating consul metadata in data centre "${dataCentre}"`);

    let serviceDefinition = yield serviceDefinitionProvider.getKeyValue(deployment);
    let serverRoleDefinition = yield serverRoleProvider.getKeyValue(deployment);
    let serviceInstallation = yield serviceInstallationProvider.getKeyValue(deployment, s3Path);
    let deploymentDefinition = yield deploymentDefinitionProvider.getKeyValue(deployment);
    let serviceDeploymentDefinition = yield serviceDeploymentProvider.getKeyValue(deployment, expectedNodeDeployments);

    yield [
      updateTargetState(deployment, serviceDefinition),
      updateTargetState(deployment, serverRoleDefinition),
      updateTargetState(deployment, serviceInstallation),
      updateTargetState(deployment, deploymentDefinition),
      updateTargetState(deployment, serviceDeploymentDefinition)
    ];

    logger.info('Consul metadata has been updated');
  }).catch((error) => {
    logger.error('An error has occurred updating consul metadata', error);
    return Promise.reject(error);
  });
};

function updateTargetState({ deploymentId, environmentName: environment }, { key, value }) {
  return UpdateTargetState({ deploymentId, environment, key, value });
}
