/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

const environmentName = 'my-env';

function setup() {
  let expectedAutoScalingGroup = {
    AutoScalingGroupName: 'sb1-in-Test',
    Instances: [
      { InstanceId: 'instance-one' },
      { InstanceId: 'instance-two' }
    ]
  };

  let fakes = {
    'modules/resourceFactories/AsgResource': {
      createScheduledAction: sinon.stub().returns(Promise.resolve()),
      deleteScheduledAction: sinon.stub().returns(Promise.resolve()),
      describeScheduledActions: sinon.stub().returns(Promise.resolve([])),
      get: sinon.stub().returns(Promise.resolve(expectedAutoScalingGroup)),
      setTag: sinon.stub().returns(Promise.resolve())
    },
    'modules/clientFactories/ec2InstanceClientFactory': {
      setTag: sinon.stub().returns(Promise.resolve())
    }
  };

  let sut = proxyquire('commands/asg/SetAutoScalingGroupSchedule', fakes);

  return [sut, fakes];
}

describe('SetAutoScalingGroupScheduleCommandHandler:', () => {
  describe('When an AutoScalingGroup named "sb1-in-Test" exists in "my-env" environment', () => {
    describe('and I send a command to set its schedule tag to "247" without affecting its instances too', () => {
      let promise = null;
      let fakes;
      before('sending the command', () => {
        let [sut, $fakes] = setup();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          environmentName,
          schedule: '247',
          propagateToInstances: false
        };

        fakes = $fakes;
        promise = sut(command);
      });

      it('should return a list of AutoScalingGroup changed that contains the target one', () =>
        promise.then(result => result.should.match({
          ChangedAutoScalingGroups: ['sb1-in-Test']
        })));

      it('should return a list of ChangedInstances changed that has to be undefined', () =>
        promise.then(result => result.should.match({
          ChangedInstances: undefined
        })));

      it('should set schedule tag for the target AutoScalingGroup', () =>
        promise.then(() => sinon.assert.calledWith(
          fakes['modules/resourceFactories/AsgResource'].setTag,
          {
            environmentName,
            name: 'sb1-in-Test',
            tagKey: 'Schedule',
            tagValue: '247'
          })));

      it('should not set schedule tag for any EC2 instance', () =>
        promise.then(() => sinon.assert.notCalled(fakes['modules/clientFactories/ec2InstanceClientFactory'].setTag)));
    });

    describe('and I send a command to set schedule tag to "247" to it and its instances too', () => {
      let fakes;
      let promise;
      before('sending the command', () => {
        let [sut, $fakes] = setup();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          environmentName,
          schedule: '247',
          propagateToInstances: true
        };

        fakes = $fakes;
        promise = sut(command);
      });

      it('should return a list of AutoScalingGroup changed that contains the target one', () =>
        promise.then(result => result.should.match({
          ChangedAutoScalingGroups: ['sb1-in-Test']
        })));

      it('should return a list of ChangedInstances changed that contains AutoScalingGroup instances', () =>
        promise.then(result => result.should.match({
          ChangedInstances: ['instance-one', 'instance-two']
        })));

      it('should set schedule tag for the target AutoScalingGroup', () =>
        promise.then(() => sinon.assert.calledWith(
          fakes['modules/resourceFactories/AsgResource'].setTag,
          {
            environmentName,
            name: 'sb1-in-Test',
            tagKey: 'Schedule',
            tagValue: '247'
          }
        )));

      it('should set schedule tag for the EC2 instances', () =>
        promise.then(() => sinon.assert.calledWith(
          fakes['modules/clientFactories/ec2InstanceClientFactory'].setTag,
          {
            environmentName,
            instanceIds: ['instance-one', 'instance-two'],
            tagKey: 'Schedule',
            tagValue: '247'
          }
        )));
    });

    describe('and I send a command to reset the schedule tag to empty', () => {
      let fakes;
      let promise;
      before('sending the command', () => {
        let [sut, $fakes] = setup();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          environmentName,
          schedule: '',
          propagateToInstances: true
        };

        fakes = $fakes;
        promise = sut(command);
      });

      it('should set the AutoScalingGroup schedule tag to empty', () =>
        promise.then(() => sinon.assert.calledWith(
          fakes['modules/resourceFactories/AsgResource'].setTag,
          {
            environmentName,
            name: 'sb1-in-Test',
            tagKey: 'Schedule',
            tagValue: ''
          }
        )));

      it('should set the AutoScalingGroup Instances schedule tags to empty', () =>
        promise.then(() => sinon.assert.calledWith(
          fakes['modules/clientFactories/ec2InstanceClientFactory'].setTag,
          {
            environmentName,
            instanceIds: ['instance-one', 'instance-two'],
            tagKey: 'Schedule',
            tagValue: ''
          }
        )));
    });

    describe('and I send an invalid command with an invalid schedule', () => {
      let promise;
      before('sending the command', () => {
        let [sut] = setup();

        let command = {
          name: 'setAutoScalingGroupScheduleTag',
          autoScalingGroupName: 'sb1-in-Test',
          environmentName,
          schedule: 'Wrong value',
          propagateToInstances: true
        };

        promise = sut(command);
      });

      it.skip('should refuse the command', function () {
        return promise.should.be.rejectedWith('Provided schedule is invalid');
      });
    });
  });
});
