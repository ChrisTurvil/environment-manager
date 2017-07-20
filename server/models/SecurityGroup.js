/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let ScanSecurityGroups = require('queryHandlers/ScanSecurityGroups');
let TaggableMixin = require('./TaggableMixin');

class SecurityGroup {
  constructor(data) {
    _.assign(this, data);
  }

  getName() {
    return this.getTag('Name');
  }

  static getAllByIds(partition, vpcId, groupIds) {
    let query = {
      name: 'ScanSecurityGroups',
      partition,
      vpcId,
      groupIds
    };
    return ScanSecurityGroups(query).then(list => list.map(item => new TaggableSecurityGroup(item)));
  }

  static getAllByNames(partition, vpcId, groupNames) {
    let query = {
      name: 'ScanSecurityGroups',
      partition,
      vpcId,
      groupNames
    };
    return ScanSecurityGroups(query).then(list => list.map(item => new TaggableSecurityGroup(item)));
  }
}

class TaggableSecurityGroup extends TaggableMixin(SecurityGroup) { }

module.exports = TaggableSecurityGroup;
