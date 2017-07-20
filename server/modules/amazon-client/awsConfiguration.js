/**
 * This module provides functions for retrieving data required
 * to interact with managed environments in other accounts.
 */

'use strict';

let Promise = require('bluebird');
let accounts = require('modules/data-access/accounts');
let environments = require('modules/data-access/configEnvironments');
let environmentTypes = require('modules/data-access/configEnvironmentTypes');

function getAccountForEnvironmentType(environmentType) {
  return accounts.get({ AccountNumber: parseInt(environmentType.Value.AWSAccountNumber, 10) });
}

function partitionOf(account, environmentType) {
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
}

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
    ? getAccountForEnvironmentType(environmentType)
    : null));
  return Promise.join(accountP, environmentTypeP, partitionOf);
}

function distinct(array) {
  return Array.from(array.reduce((acc, val) => { acc.set(JSON.stringify(val), val); return acc; }, new Map()).values());
}

function scanPartitions() {
  let environmentTypesP = environmentTypes.scan();
  return Promise.map(environmentTypesP,
    environmentType => getAccountForEnvironmentType(environmentType)
      .then(account => partitionOf(account, environmentType)))
    .then(partitions => partitions.filter(({ region, roleArn }) => region !== undefined && roleArn !== undefined))
    .then(distinct);
}

module.exports = {
  getPartitionsForEnvironment,
  getPartitionsForEnvironmentType,
  scanPartitions
};
