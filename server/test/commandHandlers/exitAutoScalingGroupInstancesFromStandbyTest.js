/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sinon = require('sinon');
require('should');
let proxyquire = require('proxyquire');
let assert = require('assert');
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');

describe('exitAutoScalingGroupInstancesToStandby', function () {
  const name = 'ExitAutoScalingGroupInstancesFromStandby';
  const autoScalingGroupName = 'sb1-in-Test';
  const environmentName = 'my-env';
  const instanceID1 = 'instance-one';
  const instanceID2 = 'instance-two';
  const instanceIds = [instanceID1, instanceID2];
  const command = { name, autoScalingGroupName, environmentName, instanceIds };
  const expectedASGsize = 2;

  let SetAutoScalingGroupSizeMock;
  let autoScalingGroupSizePredictorMock;
  let asgResourceMock;
  let sut;

  function setupMocks(expectedASGResponse, useMockSizePredictor) {
    autoScalingGroupSizePredictorMock = {
      predictSizeAfterExitingInstancesFromStandby: sinon.stub().returns(Promise.resolve(expectedASGsize))
    };

    asgResourceMock = {
      get: sinon.stub().returns(Promise.resolve(expectedASGResponse)),
      exitInstancesFromStandby: sinon.stub().returns(Promise.resolve())
    };

    SetAutoScalingGroupSizeMock = sinon.stub().returns(Promise.resolve());

    sut = proxyquire('commands/asg/ExitAutoScalingGroupInstancesFromStandby',
      Object.assign(
        {
          'modules/resourceFactories/AsgResource': asgResourceMock,
          'commands/asg/SetAutoScalingGroupSize': SetAutoScalingGroupSizeMock
        },
        (useMockSizePredictor
          ? { 'modules/autoScalingGroupSizePredictor': autoScalingGroupSizePredictorMock }
          : {})));
  }

  describe('Command requirements', function () {
    beforeEach(setupMocks.bind(this, null, true));

    let requiredProps = ['environmentName', 'autoScalingGroupName', 'instanceIds'];

    requiredProps.forEach((prop) => {
      it(`should fail if ${prop} is not set`, () => {
        let invalidCommand = Object.assign({}, command);
        delete invalidCommand[prop];

        assert.throws(sut.bind(sut, invalidCommand));
      });
    });
  });

  describe('With both instances in service', () => {
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Tags: [
        {
          Key: 'Environment'
        }
      ],
      Instances: []
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, true));

    it('resolves a list of instances exited standby', () => {
      return sut(command).then((result) => {
        assert.deepEqual(result, { InstancesExitedFromStandby: instanceIds });
      });
    });

    it(`sets ASG maximum size to ${expectedASGsize}`, () => {
      return sut(command).then(result =>
        sinon.assert.calledWith(
          SetAutoScalingGroupSizeMock,
          {
            environmentName,
            autoScalingGroupName,
            autoScalingGroupMaxSize: expectedASGsize
          }
        ));
    });

    it(`sets ASG minimum size to ${expectedASGsize}`, () => {
      return sut(command).then(result =>
        sinon.assert.calledWith(
          SetAutoScalingGroupSizeMock,
          {
            environmentName,
            autoScalingGroupName,
            autoScalingGroupMinSize: expectedASGsize
          }
        ));
    });

    it('requests all desired instances to be exited from standby', () => {
      return sut(command).then(result =>
        sinon.assert.calledWith(
          asgResourceMock.exitInstancesFromStandby,
          {
            environmentName,
            name: autoScalingGroupName,
            instanceIds
          }));
    });
  });

  describe('Attempting to standby an ASG with a Pending service', () => {
    const inServiceStatus = 'InService';
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Instances: [
        { InstanceId: instanceID1, LifecycleState: inServiceStatus },
        { InstanceId: instanceID2, LifecycleState: inServiceStatus }
      ]
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, false));

    it('should be rejected', () => {
      return sut(command).catch((result) => {
        assert(result instanceof InvalidOperationError);
        result.message.should.containEql(`"${instanceID1}" cannot be exited from standby as its LifecycleState is ${inServiceStatus}`);
      });
    });
  });

  describe('Attempting to standby an unknown service', () => {
    const unknownService = 'instance-unknown';
    const mockASGResponse = {
      AutoScalingGroupName: autoScalingGroupName,
      Instances: [
        { InstanceId: unknownService, LifecycleState: 'InService' }
      ]
    };

    beforeEach(setupMocks.bind(this, mockASGResponse, false));

    it('should be rejected', () => {
      return sut(command).catch((result) => {
        assert(result instanceof InvalidOperationError);
        result.message.should.containEql(`"${instanceID1}" is not part of "${autoScalingGroupName}"`);
      });
    });
  });
});

