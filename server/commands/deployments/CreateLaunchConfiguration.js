'use strict';

let assert = require('assert');
let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let launchConfigurationResourceFactory = require('modules/resourceFactories/launchConfigurationResourceFactory');
let _ = require('lodash');

module.exports = function CreateLaunchConfigurationCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assert(command, 'Expected "command" argument not to be null.');
  assert(command.template, 'Expected "command" argument to contain "template" property not null.');
  assert(command.partition, 'Expected "command" argument to contain "partition" property not null or empty.');

  return co(function* () {
    let template = command.template;
    let { partition } = command;
    let launchConfigurationName = template.launchConfigurationName;

    logger.info(`Creating [${launchConfigurationName}] LaunchConfiguration...`);

    let launchConfigurationClient = yield launchConfigurationResourceFactory(partition);

    let request = getCreateLaunchConfigurationRequest(template);
    yield launchConfigurationClient.post(request);

    logger.info(`LaunchConfiguration [${launchConfigurationName}] has been created`);
  });
};

function getCreateLaunchConfigurationRequest(template) {
  return {
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
