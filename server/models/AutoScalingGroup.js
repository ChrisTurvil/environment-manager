/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let EnvironmentType = require('models/EnvironmentType');
let TaggableMixin = require('./TaggableMixin');
let launchConfigurationResourceFactory = require('modules/resourceFactories/launchConfigurationResourceFactory');

class AutoScalingGroup {

  constructor(data) {
    _.assign(this, data);
  }

  getLaunchConfiguration() {
    let self = this;
    return co(function* () {
      let name = self.LaunchConfigurationName;
      if (name === undefined) {
        throw new Error(`Launch configuration doesn't exist for ${self.AutoScalingGroupName}`);
      }
      let client = launchConfigurationResourceFactory.create(null, { accountName: self.$accountName });
      return client.get({ name });
    });
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.getTag('EnvironmentType'));
  }

  getRuntimeServerRoleName() {
    return this.getTag('Role');
  }
}

module.exports = TaggableMixin(AutoScalingGroup);
