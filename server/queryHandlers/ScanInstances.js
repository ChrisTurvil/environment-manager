/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ec2InstanceResourceFactory = require('modules/resourceFactories/ec2InstanceResourceFactory');
let co = require('co');

module.exports = function ScanInstancesQueryHandler({ partition, filter }) {
  return co(function* () {
    // Create an instance of the resource to work with based on the resource
    // descriptor and AWS account name.
    let resource = yield ec2InstanceResourceFactory(partition);

    // Scan resource items
    return resource.all({ filter });
  });
};
