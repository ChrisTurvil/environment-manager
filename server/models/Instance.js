/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let ScanInstances = require('queryHandlers/ScanInstances');
let ScanInstancesInAllPartitions = require('queryHandlers/ScanInstancesInAllPartitions');
let ec2InstanceClientFactory = require('modules/clientFactories/ec2InstanceClientFactory');
let { getPartitionsForEnvironment } = require('modules/amazon-client/awsConfiguration');
let moment = require('moment');
let logger = require('modules/logger');
let TaggableMixin = require('./TaggableMixin');

class Instance {
  constructor(data) {
    _.assign(this, data);
    this.CreationTime = this.getCreationTime();
  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  persistTag(tag) {
    return ec2InstanceClientFactory.create({ partition: this.partition }).then((client) => {
      let parameters = {
        instanceIds: [this.InstanceId],
        tagKey: tag.key,
        tagValue: tag.value
      };

      return client.setTag(parameters);
    });
  }

  getCreationTime() {
    return _.get(this, 'BlockDeviceMappings[0].Ebs.AttachTime');
  }

  static getById(instanceId) {
    let filter = { 'instance-id': instanceId };
    return ScanInstancesInAllPartitions({ filter }).then(list => new TaggableInstance(list[0]));
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let partition = yield getPartitionsForEnvironment(environmentName);
      let startTime = moment.utc();

      let filter = {};
      filter['tag:Environment'] = environmentName;

      return ScanInstances({ filter, partition })
        .then((result) => {
          let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
          logger.debug(`server-status-query: InstancesQuery took ${duration}ms`);
          return result;
        });
    });
  }
}

class TaggableInstance extends TaggableMixin(Instance) { }

module.exports = TaggableInstance;
