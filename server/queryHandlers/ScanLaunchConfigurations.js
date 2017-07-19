/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let launchConfigurationResourceFactory = require('modules/resourceFactories/launchConfigurationResourceFactory');
let co = require('co');

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  let resource = yield launchConfigurationResourceFactory(query.partition);

  // Scan resource items
  return resource.all({ names: query.launchConfigurationNames });
}

module.exports = co.wrap(handler);
