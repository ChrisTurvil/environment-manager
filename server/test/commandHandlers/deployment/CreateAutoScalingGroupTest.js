/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('CreateAutoScalingGroup', function () {
  const name = 'CreateAutoScalingGroup';
  const environmentName = 'my-env';
  const autoScalingGroupName = 'auto-scaling-group';
  const launchConfigurationName = 'launch-configuration';
  const topicNotificationMapping = [];
  const lifecycleHooks = [];
  const min = 1;
  const desired = 2;
  const max = 3;
  const size = { min, desired, max };
  const subnets = ['subnet-a', 'subnet-b'];
  const EnvironmentName = 'pr1';
  const Schedule = '';
  const tags = { EnvironmentName, Schedule };

  const template = {
    autoScalingGroupName,
    launchConfigurationName,
    topicNotificationMapping,
    lifecycleHooks,
    size,
    subnets,
    tags
  };

  let autoScalingClientMock;
  let command;
  let sut;

  beforeEach(() => {
    autoScalingClientMock = { post: sinon.stub() };
    autoScalingClientMock.post.returns(Promise.resolve());

    command = { name, environmentName, template };

    sut = proxyquire('commands/deployments/CreateAutoScalingGroup.js', {
      'modules/resourceFactories/AsgResource': autoScalingClientMock
    });
  });

  it('should post template values to the ASG client', () => {
    return sut(command).then((result) => {
      autoScalingClientMock.post.called.should.be.true();
      autoScalingClientMock.post.getCall(0).args[0].should.eql({
        AutoScalingGroupName: template.autoScalingGroupName,
        environmentName: 'my-env',
        LaunchConfigurationName: template.launchConfigurationName,
        MaxSize: template.size.max,
        MinSize: template.size.min,
        VPCZoneIdentifier: `${template.subnets[0]},${template.subnets[1]}`,
        DesiredCapacity: template.size.desired,
        Tags: [
          { Key: 'EnvironmentName', Value: EnvironmentName },
          { Key: 'Schedule', Value: '' }
        ]
      });
    });
  });
});

