/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ec2InstanceResourceFactory = require('modules/resourceFactories/ec2InstanceResourceFactory');

module.exports = {
  create(parameters) {
    return ec2InstanceResourceFactory(parameters.partition);
  }
};
