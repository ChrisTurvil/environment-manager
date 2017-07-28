/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let fp = require('lodash/fp');
let ec2ImageResourceFactory = require('modules/resourceFactories/ec2ImageResourceFactory');
let imageSummary = require('modules/machineImage/imageSummary');
let assert = require('assert');
let { scanPartitions } = require('modules/amazon-client/awsPartitions');

/**
 * Get all the EC2 images ordered by AMI Type (lexicographical, ascending) then by
 * AMI version (semver, descending).
 */
function handler({ accountId, filter }) {
  assert(accountId !== undefined, 'accountId is required');
  return scanPartitions(accountId)
    .then(ps => Promise.map(ps, ({ region }) => ec2ImageResourceFactory.all({ accountId, region, filter })))
    .then(fp.flatten)
    .then(images => imageSummary.rank(images.map(imageSummary.summaryOf).sort(imageSummary.compare)));
}

module.exports = handler;
