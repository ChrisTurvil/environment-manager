'use strict';

let { account } = require('modules/amazon-client/partition');
let { filter } = require('lodash/fp');
let { getByName: getAccount } = require('modules/awsAccounts');
let { scanPartitions } = require('modules/amazon-client/awsConfiguration');

function getPartitionsInAccount(accountName) {
  let partitionFilterP = accountName !== undefined
    ? getAccount(accountName).then(({ AccountNumber }) => filter(p => account(p) === `${AccountNumber}`))
    : Promise.resolve(ps => ps);

  let partitionsP = scanPartitions();

  return Promise.join(partitionsP, partitionFilterP, (partitions, filterPartitions) => filterPartitions(partitions));
}

module.exports = getPartitionsInAccount;
