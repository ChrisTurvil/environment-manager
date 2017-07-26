/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let launchConfigurationClient = require('modules/resourceFactories/launchConfigurationResourceFactory');

module.exports = ({ environmentName, launchConfigurationNames }) =>
  launchConfigurationClient.all({ environmentName, names: launchConfigurationNames });
