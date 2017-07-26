/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let launchConfigurationClient = require('modules/resourceFactories/launchConfigurationResourceFactory');
let serviceTargets = require('modules/service-targets');
let logger = require('modules/logger');
let AsgResource = require('modules/resourceFactories/AsgResource');

function getTagValues(tagName, { Tags }) {
  return Tags.filter(tag => tag.Key === tagName).map(({ Value }) => Value);
}

function $delete({ environmentName, autoScalingGroupName }) {
  return AsgResource.get({ environmentName, autoScalingGroupName })
    .then((asg) => {
      let { LaunchConfigurationName } = asg;
      logger.info(`Deleting AutoScalingGroup ${autoScalingGroupName} and associated Launch configuration ${LaunchConfigurationName}`);
      let deleteLaunchConfigP = LaunchConfigurationName !== undefined
        ? launchConfigurationClient.delete({ environmentName, name: LaunchConfigurationName })
        : Promise.resolve();
      let deleteAsgP = AsgResource.delete({ environmentName, force: true, name: autoScalingGroupName });
      let deleteTargetStateP = Promise.map(getTagValues('Role', asg),
        role => serviceTargets.removeRuntimeServerRoleTargetState(environmentName, role));
      return Promise.all([deleteAsgP, deleteLaunchConfigP, deleteTargetStateP]).then(() => true);
    });
}

module.exports = $delete;
