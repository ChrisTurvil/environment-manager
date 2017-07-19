/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let ec2InstanceResourceFactory = require('modules/resourceFactories/ec2InstanceResourceFactory');

function* getAWSInstances(partition, instancesIds) {
  let resource = yield ec2InstanceResourceFactory(partition);

  let filter = {
    'instance-id': instancesIds
  };

  let instances = yield resource.all({ filter });
  return _.map(instances, (instance) => {
    let ret = {
      PrivateIpAddress: instance.PrivateIpAddress,
      InstanceId: instance.InstanceId,
      InstanceType: instance.InstanceType,
      AvailabilityZone: instance.Placement.AvailabilityZone,
      State: _.capitalize(instance.State.Name),
      ImageId: instance.ImageId,
      LaunchTime: instance.LaunchTime
    };
    instance.Tags.forEach((tag) => {
      ret[tag.Key] = tag.Value;
    });
    return ret;
  });
}

module.exports = co.wrap(getAWSInstances);
