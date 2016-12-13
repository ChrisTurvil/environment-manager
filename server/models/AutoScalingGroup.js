/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let sender = require('modules/sender');
let EnvironmentType = require('models/EnvironmentType');
let Environment = require('models/Environment');
let taggable = require('./taggable');
let serviceTargets = require('modules/service-targets');
let resourceProvider = require('modules/resourceProvider');

class AutoScalingGroup {

  constructor(data) {
    _.assign(this, data);
  }

  getLaunchConfiguration() {
    let self = this;
    return co(function* () {
      let name = self.LaunchConfigurationName;
      let client = yield resourceProvider.getInstanceByName('launchconfig', { accountName: self.$accountName });
      return client.get({ name });
    });
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.getTag('EnvironmentType'));
  }

  getRuntimeServerRoleName() {
    return this.getTag('Role');
  }

  deleteASG() {
    let environmentName = this.getTag('Environment');
    let self = this;
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let asgResource = yield resourceProvider.getInstanceByName('asgs', { accountName });
      let launchConfigResource = yield resourceProvider.getInstanceByName('launchconfig', { accountName });
      yield asgResource.delete({ name: self.AutoScalingGroupName, force: true });
      yield launchConfigResource.delete({ name: self.LaunchConfigurationName });

      yield serviceTargets.removeRuntimeServerRoleTargetState(environmentName, self.getRuntimeServerRoleName());

      return true;
    });
  }

  static getByName(accountName, autoScalingGroupName) {
    return co(function* () {
      let query = {
        name: 'GetAutoScalingGroup',
        accountName,
        autoScalingGroupName,
      };

      let data = yield sender.sendQuery({ query });
      data.$accountName = accountName;
      data.$autoScalingGroupName = autoScalingGroupName;
      return data;
    });
  }

}

taggable(AutoScalingGroup);

module.exports = AutoScalingGroup;