/**
 * This module provides functions for retrieving data required
 * to interact with managed environments in other accounts.
 */

'use strict';

let Promise = require('bluebird');
let { getByName: getAccountByName } = require('modules/awsAccounts');
let environments = require('modules/data-access/configEnvironments');
let environmentTypes = require('modules/data-access/configEnvironmentTypes');

function distinct(array) {
  return Array.from(array.reduce((acc, val) => { acc.set(JSON.stringify(val), val); return acc; }, new Map()).values());
}

function getAccountForEnvironmentType(environmentType) {
  return getAccountByName(environmentType.Value.AWSAccountNumber);
}

function partitionOf(account, environmentType) {
  if (account !== null && environmentType !== null) {
    let { AccountNumber: accountId, RoleArn: roleArn } = account;
    let { Value: { Region: region } = {} } = environmentType;
    return Object.assign(...[
      {},
      accountId !== undefined && accountId !== null ? { accountId: `${accountId}` } : {},
      region !== undefined && region !== null ? { region } : {},
      roleArn !== undefined && roleArn !== null ? { roleArn } : {}
    ]);
  } else {
    return null;
  }
}

function getPartitionForEnvironment(environmentName) {
  return environments.get({ EnvironmentName: environmentName })
    .then(environment => (environment !== null
      ? getPartitionForEnvironmentType(environment.Value.EnvironmentType)
      : null));
}

function getPartitionForEnvironmentType(environmentTypeName) {
  if (typeof environmentTypeName !== 'string') {
    return Promise.resolve(null);
  }
  let environmentTypeP = environmentTypes.get({ EnvironmentType: environmentTypeName });
  let accountP = environmentTypeP.then(environmentType => (environmentType !== null
    ? getAccountForEnvironmentType(environmentType)
    : null));
  return Promise.join(accountP, environmentTypeP, partitionOf);
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
  getPartitionForEnvironment,
  getPartitionForEnvironmentType,
  scanPartitions
};
