/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let fp = require('lodash/fp');
let AsgResource = require('modules/resourceFactories/AsgResource');
let { getPartitionsInAccount } = require('modules/amazon-client/awsPartitions');

module.exports = ({ accountId, region, autoScalingGroupNames }) =>
  (region !== undefined
    ? AsgResource.all({ accountId, region, names: autoScalingGroupNames })
    : Promise.map(getPartitionsInAccount(accountId),
      ({ region }) => AsgResource.all({ accountId, region, names: autoScalingGroupNames })) // eslint-disable-line no-shadow
      .then(fp.flatten));
