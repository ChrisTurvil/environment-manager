/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let GetKeyPair = require('queryHandlers/GetKeyPair');

module.exports = {
  get(configuration, awsOptions) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(awsOptions, 'Expected "awsOptions" argument not to be null');

    let customKeyName = configuration.serverRole.ClusterKeyName;
    if (customKeyName) {
      return getKeyPairByName(customKeyName, awsOptions)
        .then(
        keyPair => Promise.resolve(keyPair.KeyName),
        error => Promise.reject(new ConfigurationError(
          `An error has occurred verifying "${customKeyName}" key pair specified in configuration.`,
          error))
        );
    } else {
      let keyName = configuration.cluster.KeyPair;
      if (keyName === '' || keyName === undefined || keyName === null) {
        return Promise.reject(
          new ConfigurationError('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration'));
      }

      return getKeyPairByName(keyName, awsOptions)
        .then(
        keyPair => Promise.resolve(keyPair.KeyName),
        error => Promise.reject(new ConfigurationError(
          `An error has occurred verifying "${keyName}" key pair defined by convention. ` +
          'If needed a different one can be specified in configuration.',
          error))
        );
    }
  }
};

function getKeyPairByName(keyName, awsOptions) {
  return GetKeyPair({ awsOptions, keyName });
}
