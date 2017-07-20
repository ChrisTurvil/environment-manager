/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let _ = require('lodash');
let CreateLaunchConfiguration = require('commands/deployments/CreateLaunchConfiguration');
let CreateAutoScalingGroup = require('commands/deployments/CreateAutoScalingGroup');

module.exports = function ProvideInfrastructure(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let {
      asgsToCreate,
      deploymentId,
      launchConfigsToCreate,
      partition
    } = command;

    logger.info('Creating required infrastructure...');
    logger.info(`${launchConfigsToCreate.length} launch configs to create`);

    yield launchConfigsToCreate.map(
      template => CreateLaunchConfiguration({ deploymentId, template, partition })
    );

    _.each(launchConfigsToCreate, (template) => {
      let securityGroupsNames = _.map(template.securityGroups, sg => sg.getName());
      logger.info(`LaunchConfiguration ${template.launchConfigurationName} Security Groups: ${securityGroupsNames.join(', ')}`);
    });

    logger.info(`${asgsToCreate.length} ASGs to create`);
    yield asgsToCreate.map(
      template => provideAutoScalingGroup(template, partition, deploymentId)
    );
  }).catch((error) => {
    logger.error('An error has occurred providing the expected infrastructure', error);
    return Promise.reject(error);
  });
};

function provideAutoScalingGroup(autoScalingTemplate, partition, deploymentId) {
  let command = {
    deploymentId,
    partition,
    template: autoScalingTemplate
  };

  return CreateAutoScalingGroup(command).catch(error => (
      error.name === 'AutoScalingGroupAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}
