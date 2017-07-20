/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { getByName: getAccount } = require('modules/awsAccounts');
let { scanPartitions } = require('modules/amazon-client/awsConfiguration');
let { account } = require('modules/amazon-client/partition');
let { filter, flatten } = require('lodash/fp');
let ScanImages = require('queryHandlers/ScanImages');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;
  let query = { filter: {} };

  let partitionFilterP = accountName !== undefined
    ? getAccount(accountName).then(({ AccountNumber }) => filter(p => account(p) === `${AccountNumber}`))
    : Promise.resolve(ps => ps);

  let partitionsP = scanPartitions();

  return Promise.join(partitionsP, partitionFilterP, (partitions, filterPartitions) => filterPartitions(partitions))
    .then(ps => Promise.map(ps, partition => ScanImages(Object.assign({}, query, { partition }))))
    .then(flatten)
    .then((stable !== undefined ? filter(({ IsStable }) => IsStable === stable) : ps => ps))
    .then(ps => res.json(ps));
}

module.exports = {
  getImages
};
