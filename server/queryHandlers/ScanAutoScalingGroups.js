/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let AsgResource = require('modules/resourceFactories/AsgResource');

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let resource = new AsgResource(query.partition);
  return resource.all({ names: query.autoScalingGroupNames });
}

module.exports = co.wrap(handler);
