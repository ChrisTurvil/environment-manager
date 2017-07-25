/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let fp = require('lodash/fp');
let AsgResource = require('modules/resourceFactories/AsgResource');
let { scanPartitions } = require('modules/amazon-client/awsPartitions');

module.exports = function ScanCrossAccountAutoScalingGroups(query) {
  return Promise.map(scanPartitions(), ({ accountId, region }) => AsgResource.all({ accountId, region }))
    .then(fp.flatten);
};
