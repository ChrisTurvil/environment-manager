/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let { flatten } = require('lodash/fp');
let { scanPartitions } = require('modules/amazon-client/awsConfiguration');
let { account } = require('modules/amazon-client/partition');

function invoke(fn) {
  return Promise.map(scanPartitions(), p => Object.assign(fn(p), { AccountName: account(p), Region: p.region }))
    .then(flatten);
}

module.exports = invoke;
