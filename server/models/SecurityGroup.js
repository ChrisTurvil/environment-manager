/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let TaggableMixin = require('./TaggableMixin');

class SecurityGroup {
  constructor(data) {
    _.assign(this, data);
  }

  getName() {
    return this.getTag('Name');
  }
}

class TaggableSecurityGroup extends TaggableMixin(SecurityGroup) { }

module.exports = TaggableSecurityGroup;
