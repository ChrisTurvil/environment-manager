/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');
let launchConfigurationTemplatesProvider = require('modules/provisioning/launchConfigurationTemplatesProvider');
let configProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let asgTemplatesProvider = require('modules/provisioning/autoScalingTemplatesProvider');
let namingConvention = require('modules/provisioning/namingConventionProvider');
let { get: getASG } = require('modules/resourceFactories/AsgResource');
let _ = require('lodash');
let ScanAutoScalingGroups = require('queryHandlers/ScanAutoScalingGroups');
let ScanLaunchConfigurations = require('queryHandlers/ScanLaunchConfigurations');
let { getPartitionForEnvironment } = require('modules/amazon-client/awsPartitions');

module.exports = function GetInfrastructureRequirements(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let deployment = command.deployment;
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let slice = deployment.serviceSlice;
    let requiredInfra = { asgsToCreate: [], launchConfigsToCreate: [], expectedInstances: 0 };

    assert(environmentName !== undefined);

    logger.info('Reading infrastructure configuration...');
    let { accountId } = yield getPartitionForEnvironment(environmentName);
    let configuration = yield configProvider.get(environmentName, serviceName, deployment.serverRoleName);
    let asgsToCreate = yield getASGsToCreate(logger, configuration, accountId, slice);
    requiredInfra.expectedInstances = yield getExpectedNumberOfInstances(environmentName, configuration, asgsToCreate, slice);

    if (!asgsToCreate.length) return requiredInfra;
    let launchConfigsToCreate = yield getLaunchConfigsToCreate(logger, configuration, asgsToCreate, accountId);

    // Check launchConfigs are valid
    launchConfigsToCreate.forEach((template) => {
      let minVolumeSize = template.image.rootVolumeSize;
      let osBlockDeviceMapping = _.find(template.devices, d => _.includes(['/dev/sda1', '/dev/xvda'], d.DeviceName));
      let instanceVolumeSize = osBlockDeviceMapping.Ebs.VolumeSize;
      if (instanceVolumeSize < minVolumeSize) {
        throw new DeploymentValidationError(`Cannot create Launch Configuration. The specified OS volume size (${instanceVolumeSize} GB) is not sufficient for image '${template.image.name}' (${minVolumeSize} GB). Please check your deployment map settings.`);
      }
    });

    requiredInfra.asgsToCreate = asgsToCreate;
    requiredInfra.launchConfigsToCreate = launchConfigsToCreate;
    return requiredInfra;
  }).catch((error) => {
    logger.error('An error has occurred while determining the required infrastructure', error);
    return Promise.reject(error);
  });
};

function getExpectedNumberOfInstances(environmentName, config, slice, asgsToCreate) {
  return co(function* () {
    if (asgsToCreate.length) {
      // ASG does not exist yet, get desired size from server role
      return config.serverRole.AutoScalingSettings.DesiredCapacity;
    } else {
      // ASG exists, read current desired size
      let autoScalingGroupName = namingConvention.getAutoScalingGroupName(config, slice);
      return getASG({ environmentName, name: autoScalingGroupName }).then(data => data.DesiredCapacity);
    }
  });
}

function getASGsToCreate(logger, configuration, accountId, slice) {
  return co(function* () {
    let autoScalingTemplates = yield asgTemplatesProvider.get(configuration, accountId);
    let autoScalingGroupNames = autoScalingTemplates
      .map(template => template.autoScalingGroupName)
      .filter((asgName) => {
        // Only create ASGs On Demand
        return slice === 'none' ||                                        // Always create ASG in overwrite mode
          configuration.serverRole.FleetPerSlice === undefined ||       // Always create ASG if FleetPerSlice not known
          configuration.serverRole.FleetPerSlice === false ||           // Always create ASG in single ASG mode
          asgName.endsWith(`-${slice}`);                                // Create ASG if it's the target slice
      });

    let autoScalingGroupNamesToCreate = yield getASGNamesToCreate(logger, autoScalingGroupNames, accountId);
    return autoScalingTemplates.filter(template =>
      autoScalingGroupNamesToCreate.indexOf(template.autoScalingGroupName) >= 0
    );
  });
}

function getASGNamesToCreate(logger, autoScalingGroupNames, accountId) {
  return co(function* () {
    logger.info(`Following AutoScalingGroups are expected: [${autoScalingGroupNames.join(', ')}]`);
    let autoScalingGroups = yield ScanAutoScalingGroups({ accountId, autoScalingGroupNames });
    let existingASGnames = autoScalingGroups.map(group =>
      group.AutoScalingGroupName
    );
    if (existingASGnames.length) {
      logger.info(`Following AutoScalingGroups already exist: [${existingASGnames.join(', ')}]`);
    }

    let missingASGnames = autoScalingGroupNames.filter(name =>
      existingASGnames.indexOf(name) < 0
    );
    if (missingASGnames.length) {
      logger.info(`Following AutoScalingGroups have to be created: [${missingASGnames.join(', ')}]`);
    } else {
      logger.info('No AutoScalingGroup has to be created');
    }

    return missingASGnames;
  });
}

function getLaunchConfigsToCreate(logger, configuration, autoScalingTemplates, accountName) {
  return co(function* () {
    let launchConfigurationNames = autoScalingTemplates.map(template =>
      template.launchConfigurationName
    );

    let launchConfigurationNamesToCreate = yield getLaunchConfigNamesToCreate(
      logger, launchConfigurationNames, accountName
    );
    if (!launchConfigurationNamesToCreate.length) {
      return [];
    }
    let launchConfigurationTemplates = yield launchConfigurationTemplatesProvider.get(
      configuration, accountName, logger
    );

    return launchConfigurationTemplates.filter(template =>
      launchConfigurationNamesToCreate.indexOf(template.launchConfigurationName) >= 0
    );
  });
}

function getLaunchConfigNamesToCreate(logger, launchConfigurationNames, accountName) {
  return co(function* () {
    logger.info(`Following LaunchConfigurations are expected: [${launchConfigurationNames.join(', ')}]`);
    let launchConfigurations = yield ScanLaunchConfigurations({ accountName, launchConfigurationNames });
    let existingLaunchConfigurationNames = launchConfigurations.map(config =>
      config.LaunchConfigurationName
    );
    if (existingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations already exist: [${existingLaunchConfigurationNames.join(', ')}]`);
    }

    let missingLaunchConfigurationNames = launchConfigurationNames.filter(name =>
      existingLaunchConfigurationNames.indexOf(name) < 0
    );
    if (missingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations have to be created: [${missingLaunchConfigurationNames.join(', ')}]`);
    } else {
      logger.info('No LaunchConfiguration has to be created');
    }

    return missingLaunchConfigurationNames;
  });
}
