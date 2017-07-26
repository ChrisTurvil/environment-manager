/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let GetKeyPair = require('queryHandlers/GetKeyPair');
let ConfigurationError = require('modules/errors/ConfigurationError.class');

module.exports = {
  get({
    cluster: { KeyPair: keyName },
    environmentName,
    serverRole: { ClusterKeyName: customKeyName } }) {
    assert(environmentName !== undefined, 'environmentName is required');
    if (customKeyName) {
      return getKeyPairByName(customKeyName, environmentName)
        .then(
        keyPair => Promise.resolve(keyPair.KeyName),
        error => Promise.reject(new ConfigurationError(
          `An error has occurred verifying "${customKeyName}" key pair specified in configuration.`,
          error))
        );
    } else {
      if (keyName === '' || keyName === undefined || keyName === null) {
        return Promise.reject(
          new ConfigurationError('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration'));
      }

      return getKeyPairByName(keyName, environmentName)
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

function getKeyPairByName(keyName, environmentName) {
  return GetKeyPair({ environmentName, keyName });
}
