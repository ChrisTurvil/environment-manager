/**
 * This module provides functions for retrieving data required
 * to interact with managed environments in other accounts.
 */

'use strict';

let Promise = require('bluebird');
let accounts = require('modules/data-access/accounts');
let environments = require('modules/data-access/configEnvironments');
let environmentTypes = require('modules/data-access/configEnvironmentTypes');

function getPartitionsForEnvironment(environmentName) {
  return environments.get({ EnvironmentName: environmentName })
    .then(environment => (environment !== null
      ? getPartitionsForEnvironmentType(environment.Value.EnvironmentType)
      : null));
}

function getPartitionsForEnvironmentType(environmentTypeName) {
  if (typeof environmentTypeName !== 'string') {
    return Promise.resolve(null);
  }
  let environmentTypeP = environmentTypes.get({ EnvironmentType: environmentTypeName });
  let accountP = environmentTypeP.then(environmentType => (environmentType !== null
    ? accounts.get({ AccountNumber: parseInt(environmentType.Value.AWSAccountNumber, 10) })
    : null));
  return Promise.join(accountP, environmentTypeP,
    (account, environmentType) => {
      if (account !== null && environmentType !== null) {
        let { RoleArn: roleArn } = account;
        let { Value: { Region: region } = {} } = environmentType;
        return Object.assign(...[
          {},
          region !== undefined && region !== null ? { region } : {},
          roleArn !== undefined && roleArn !== null ? { roleArn } : {}
        ]);
      } else {
        return null;
      }
    });
}

module.exports = {
  getPartitionsForEnvironment,
  getPartitionsForEnvironmentType
};
