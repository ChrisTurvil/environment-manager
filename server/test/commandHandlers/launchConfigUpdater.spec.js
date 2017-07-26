/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');

describe('launchConfigUpdater: ', () => {
  let environmentName = 'my-env';
  let AutoScalingGroupName = 'pr1-ta-Web';
  let UpdateAction = (launchConfiguration) => { launchConfiguration.updated = true; };

  let expectedLaunchConfiguration = {
    LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web'
  };

  let autoScalingGroup = {
    getLaunchConfiguration: sinon.stub().returns(Promise.resolve(expectedLaunchConfiguration)),
    $autoScalingGroupName: AutoScalingGroupName
  };


  let promise;
  let fakes;

  before('Setting the launch configuration', () => {
    fakes = {
      'modules/resourceFactories/launchConfigurationResourceFactory': {
        post: sinon.stub().returns(Promise.resolve()),
        delete: sinon.stub().returns(Promise.resolve())
      },
      'modules/resourceFactories/AsgResource': {
        put: sinon.stub().returns(Promise.resolve())
      }
    };
    let sut = proxyquire('commands/launch-config/launchConfigUpdater', fakes);

    promise = sut.set(environmentName, autoScalingGroup, UpdateAction);
  });

  it('AutoScalingGroup LaunchConfiguration should be copied with a different name', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/launchConfigurationResourceFactory'].post,
        {
          environmentName,
          LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup'
        }
      )));

  it('AutoScalingGroup should be attached to the copied LaunchConfiguration', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/AsgResource'].put,
        {
          environmentName,
          name: AutoScalingGroupName,
          launchConfigurationName: 'LaunchConfig_pr1-ta-Web_Backup'
        }
      )));

  it('Original LaunchConfiguration should be deleted', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/launchConfigurationResourceFactory'].delete,
        {
          environmentName,
          name: 'LaunchConfig_pr1-ta-Web'
        }
      )));

  it('Original LaunchConfiguration should be created with the updated instance type', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/launchConfigurationResourceFactory'].post,
        {
          environmentName,
          LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web',
          updated: true
        }
      )));

  it('Original LaunchConfiguration should attached to the AutoScalingGroup', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/AsgResource'].put,
        {
          environmentName,
          name: AutoScalingGroupName,
          launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
        }
      )));

  it('Backup LaunchConfiguration should be deleted', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        fakes['modules/resourceFactories/launchConfigurationResourceFactory'].delete,
        {
          environmentName,
          name: 'LaunchConfig_pr1-ta-Web_Backup'
        }
      )));
});

