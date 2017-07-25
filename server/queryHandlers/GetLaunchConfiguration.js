/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let AsgResource = require('modules/resourceFactories/AsgResource');
let instanceDevicesProvider = require('modules/provisioning/launchConfiguration/instanceDevicesProvider');
let Image = require('models/Image');
let SecurityGroup = require('models/SecurityGroup');
let { getPartitionForEnvironment } = require('modules/amazon-client/awsPartitions');

let _ = require('lodash');

module.exports = function GetLaunchConfiguration({ autoScalingGroupName, environmentName }) {
  return co(function* () {
    let autoScalingGroup = yield AsgResource.get({ environmentName, name: autoScalingGroupName });
    let awsLaunchConfig = yield autoScalingGroup.getLaunchConfiguration();

    let Volumes = instanceDevicesProvider.fromAWS(awsLaunchConfig.BlockDeviceMappings);

    let image = yield Image.getById(awsLaunchConfig.ImageId);

    let environmentType = yield autoScalingGroup.getEnvironmentType();
    let vpcId = environmentType.VpcId;

    let { accountId, region } = yield getPartitionForEnvironment(environmentName);
    let securityGroups = yield SecurityGroup.getAllByIds(accountId, region, vpcId, awsLaunchConfig.SecurityGroups);
    let securityGroupsNames = _.map(securityGroups, group => group.getTag('Name'));

    let ret = {
      ImageId: image.ImageId,
      AMI: image.Name, // TODO: find AMI
      InstanceProfileName: awsLaunchConfig.IamInstanceProfile,
      InstanceType: awsLaunchConfig.InstanceType,
      SecurityGroups: securityGroupsNames,
      Volumes,
      UserData: new Buffer(awsLaunchConfig.UserData, 'base64').toString('ascii')
    };

    return ret;
  });
};

