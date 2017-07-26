'use strict';

let assert = require('assert');
let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let launchConfigurationClient = require('modules/resourceFactories/launchConfigurationResourceFactory');
let _ = require('lodash');

module.exports = function CreateLaunchConfigurationCommandHandler(command = {}) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let {
    environmentName,
    launchConfigurationName,
    template
  } = command;
  assert(template, 'Expected "command" argument to contain "template" property not null.');
  assert(environmentName, 'Expected "command" argument to contain "environmentName" property not null or empty.');

  return co(function* () {
    logger.info(`Creating [${launchConfigurationName}] LaunchConfiguration...`);
    let request = getCreateLaunchConfigurationRequest(environmentName, template);
    yield launchConfigurationClient.post(request);
    logger.info(`LaunchConfiguration [${launchConfigurationName}] has been created`);
  });
};

function getCreateLaunchConfigurationRequest(environmentName, template) {
  return {
    environmentName,
    LaunchConfigurationName: template.launchConfigurationName,
    AssociatePublicIpAddress: false,
    ImageId: template.image.id,
    InstanceType: template.instanceType,
    KeyName: template.keyName,
    InstanceMonitoring: {
      Enabled: template.detailedMonitoring
    },
    IamInstanceProfile: template.iamInstanceProfile,
    SecurityGroups: _.map(template.securityGroups, 'GroupId'),
    UserData: template.userData,
    BlockDeviceMappings: template.devices
  };
}
