/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let AsgResource = require('modules/resourceFactories/AsgResource');

function* handleQuery(query) {
  // Create an instance of the resource to work with based on the resource
  let resource = new AsgResource(query.partition);

  // Get AutoScalingGroup by name
  return resource.get({ name: query.autoScalingGroupName, clearCache: query.clearCache });
}

module.exports = co.wrap(handleQuery);
