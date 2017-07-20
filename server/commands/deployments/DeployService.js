/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let Enums = require('Enums');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let logger = require('modules/logger');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');
let packagePathProvider = new (require('modules/PackagePathProvider'))();
let deploymentLogger = require('modules/DeploymentLogger');
let _ = require('lodash');
let SupportedSliceNames = _.values(Enums.SliceName);
let SupportedDeploymentModes = _.values(Enums.DeploymentMode);
let s3PackageLocator = require('modules/s3PackageLocator');
let OpsEnvironment = require('models/OpsEnvironment');
let ResourceLockedError = require('modules/errors/ResourceLockedError');
let GetServicePortConfig = require('queryHandlers/GetServicePortConfig');
let { getPartitionsForEnvironment } = require('modules/amazon-client/awsConfiguration');
let { account } = require('modules/amazon-client/partition');
let GetInfrastructureRequirements = require('commands/deployments/GetInfrastructureRequirements');
let ProvideInfrastructure = require('commands/deployments/ProvideInfrastructure');
let PushDeployment = require('commands/deployments/PushDeployment');
let PreparePackage = require('commands/deployments/PreparePackage');

module.exports = function DeployServiceCommandHandler(command) {
  return co(function* () {
    let deployment = yield validateCommandAndCreateDeployment(command);
    let destination = yield packagePathProvider.getS3Path(deployment);
    let sourcePackage = getSourcePackageByCommand(command);

    if (command.isDryRun) {
      return {
        isDryRun: true,
        packagePath: command.packagePath
      };
    }

    // Run asynchronously, we don't wait for deploy to finish intentionally
    deploy(deployment, destination, sourcePackage, command);

    yield deploymentLogger.started(deployment);
    return deployment;
  });
};

function validateCommandAndCreateDeployment(command) {
  return co(function* () {
    const { mode, environmentName, serviceSlice, serviceName, serviceVersion } = command;

    if (mode === 'overwrite' && serviceSlice !== undefined && serviceSlice !== 'none') {
      throw new Error('Slice must be set to \'none\' in overwrite mode.');
    }
    if (SupportedDeploymentModes.indexOf(mode.toLowerCase()) < 0) {
      throw new Error(`Unknown mode \'${mode}\'. Supported modes are: ${SupportedDeploymentModes.join(', ')}`);
    }
    if (mode === 'bg' && SupportedSliceNames.indexOf(serviceSlice) < 0) {
      throw new Error(`Unknown slice \'${serviceSlice}\'. Supported slices are: ${SupportedSliceNames.join(', ')}`);
    }

    if (!command.packagePath) {
      let s3Package;
      try {
        s3Package = yield s3PackageLocator.findDownloadUrl({
          environment: environmentName,
          service: serviceName,
          version: serviceVersion
        });
      } catch (error) {
        throw new Error(`An attempt to locate the following package in S3 was forbidden: ${serviceName} version ${serviceVersion}`);
      }

      if (!s3Package) {
        throw new Error('Deployment package was not found. Please specify a location or upload the package to S3');
      } else {
        command.packagePath = s3Package;
      }
    }

    const opsEnvironment = yield OpsEnvironment.getByName(command.environmentName);
    let partition = yield getPartitionsForEnvironment(environmentName);
    command.accountName = account(partition);
    command.region = partition.region;
    const servicePortConfig = yield GetServicePortConfig(command.serviceName, command.serviceSlice);

    if (opsEnvironment.Value.DeploymentsLocked) {
      throw new ResourceLockedError(`The environment ${environmentName} is currently locked for deployments. Contact the environment owner.`);
    }

    let configuration = yield infrastructureConfigurationProvider.get(
      command.environmentName, command.serviceName, command.serverRoleName
    );

    let roleName = namingConventionProvider.getRoleName(configuration, command.serviceSlice);

    let deploymentContract = new DeploymentContract({
      id: command.commandId,
      environmentTypeName: configuration.environmentTypeName,
      environmentName: command.environmentName,
      region: command.region,
      serviceName: command.serviceName,
      serviceVersion: command.serviceVersion,
      serviceSlice: command.serviceSlice || '',
      servicePortConfig,
      serverRole: roleName,
      serverRoleName: command.serverRoleName,
      clusterName: configuration.cluster.Name,
      accountName: command.accountName,
      username: command.username
    });
    yield deploymentContract.validate(configuration);
    return deploymentContract;
  });
}

function deploy(deployment, destination, sourcePackage, command) {
  return co(function* () {
    let partition = yield getPartitionsForEnvironment(deployment.environmentName);
    const requiredInfra = yield getInfrastructureRequirements(partition, deployment);
    yield provideInfrastructure(partition, requiredInfra, deployment.deploymentId);
    yield preparePackage(account(partition), destination, sourcePackage, deployment.deploymentId);
    yield pushDeployment(requiredInfra, deployment, destination);

    deploymentLogger.inProgress(
      deployment.id,
      'Waiting for nodes to perform service deployment...'
    );
  }).catch((error) => {
    let deploymentStatus = {
      deploymentId: deployment.id,
      environmentName: deployment.environmentName
    };

    let newStatus = {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: sanitiseError(error)
    };

    return deploymentLogger.updateStatus(deploymentStatus, newStatus);
  }).catch(error => logger.error(error));
}

function sanitiseError(error) {
  if (_.isObjectLike(error) && !(error instanceof Error)) {
    return JSON.stringify(error);
  }
  return _.toString(error);
}

function getInfrastructureRequirements(partition, deployment) {
  return GetInfrastructureRequirements({ deployment, partition });
}

function provideInfrastructure(partition, requiredInfra, deploymentId) {
  let command = {
    asgsToCreate: requiredInfra.asgsToCreate,
    deploymentId,
    launchConfigsToCreate: requiredInfra.launchConfigsToCreate,
    partition
  };
  return ProvideInfrastructure(command);
}

function preparePackage(accountName, destination, source, deploymentId) {
  let command = {
    deploymentId,
    name: 'PreparePackage',
    accountName,
    destination,
    source
  };
  return PreparePackage(command);
}

function pushDeployment(requiredInfra, deployment, s3Path) {
  let command = {
    deployment,
    s3Path,
    expectedNodeDeployments: requiredInfra.expectedInstances
  };
  return PushDeployment(command);
}

function getSourcePackageByCommand(command) {
  return {
    url: command.packagePath
  };
}
