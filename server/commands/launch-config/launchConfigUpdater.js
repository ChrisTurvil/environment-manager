/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let { createLaunchConfigurationResource } = require('modules/resourceFactories/launchConfigurationResourceFactory');
let AsgResource = require('modules/resourceFactories/AsgResource');

module.exports = {
  //
  set(environmentName, autoScalingGroup, updateAction) {
    return co(function* () {
      // Obtain an object containing resource instances to work with
      // LaunchConfigurations and AutoScalingGroups
      //
      let autoScalingGroupName = autoScalingGroup.$autoScalingGroupName;

      let launchConfigurationClient = yield createLaunchConfigurationResource({ environmentName });

      // Send a request to obtain the LaunchConfiguration for the specific
      // AutoScalingGroup
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //
      let originalLaunchConfiguration = yield autoScalingGroup.getLaunchConfiguration();

      // Clone the original LaunchConfiguration creating a backup version
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup] (creating ...)

      let backupLaunchConfiguration = Object.assign({}, originalLaunchConfiguration);
      backupLaunchConfiguration.LaunchConfigurationName += '_Backup';

      yield launchConfigurationClient.post(backupLaunchConfiguration);

      // Attach the backup LaunchConfiguration just created to the target AutoScalingGroup
      //                          [LaunchConfiguration]
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      yield attachLaunchConfigurationToAutoScalingGroup(
        environmentName, autoScalingGroupName, backupLaunchConfiguration
      );

      // Delete the original LaunchConfiguration (a LaunchConfiguration cannot be
      // changed. Only way is delete it and create it again).
      //                          [LaunchConfiguration] (deleting...)
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      yield launchConfigurationClient.delete({ name: originalLaunchConfiguration.LaunchConfigurationName });

      // Create a new LaunchConfiguration starting from the original applying an
      // updateAction function on it.
      //                          [LaunchConfiguration] (creating ...)
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      let updatedLaunchConfiguration = Object.assign({}, originalLaunchConfiguration);
      updateAction(updatedLaunchConfiguration);

      yield launchConfigurationClient.post(updatedLaunchConfiguration);

      // Attach new LaunchConfiguration to the target AutoScalingGroup.
      // NOTE: this LaunchConfiguration is equal to the original one but updated.
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup]

      yield attachLaunchConfigurationToAutoScalingGroup(
        environmentName, autoScalingGroupName, updatedLaunchConfiguration
      );

      // Delete the backup LaunchConfiguration as no longer needed.
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup] (deleting...)
      yield launchConfigurationClient.delete({ name: backupLaunchConfiguration.LaunchConfigurationName });
    });
  }
};

function attachLaunchConfigurationToAutoScalingGroup(environmentName, autoScalingGroupName, launchConfiguration) {
  let parameters = {
    environmentName,
    name: autoScalingGroupName,
    launchConfigurationName: launchConfiguration.LaunchConfigurationName
  };

  return AsgResource.put(parameters);
}
