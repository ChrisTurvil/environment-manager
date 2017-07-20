/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let { flatten } = require('lodash/fp');
let { account } = require('modules/amazon-client/partition');

let invoke = fn => partitions =>
  Promise.map(partitions, p => Object.assign(fn(p), { AccountName: account(p), partition: p, Region: p.region }))
    .then(flatten);

module.exports = invoke;
