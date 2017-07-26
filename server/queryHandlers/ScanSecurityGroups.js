/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let { createEC2Client } = require('modules/amazon-client/childAccountClient');
let SecurityGroupResource = require('modules/resourceFactories/SecurityGroupResource');
let SecurityGroup = require('models/SecurityGroup');

module.exports = function ScanSecurityGroupsQueryHandler(
  { accountId, groupIds, groupNames, region, vpcId }) {
  assert(accountId !== undefined, 'accountId is required');
  assert(region !== undefined, 'region is required');

  return createEC2Client(accountId, region)
    .then(client => new SecurityGroupResource(client))
    .then(resource => resource.scan({ vpcId, groupIds, groupNames }))
    .then(sgs => sgs.map(sg => new SecurityGroup(sg)));
};
