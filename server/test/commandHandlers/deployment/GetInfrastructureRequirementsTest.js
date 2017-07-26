/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sinon = require('sinon');
let sinonHelper = require('test/utils/sinonHelper');
let proxyquire = require('proxyquire').noCallThru();

let AutoScalingGroupAlreadyExistsError = require('modules/errors/AutoScalingGroupAlreadyExistsError.class');
let Deployment = require('models/Deployment');

let ENVIRONMENT_NAME = 'pr1';
let SERVICE_NAME = 'MyService';
let ACCOUNT_NAME = 'Prod';
const ACCOUNT_ID = '123456789012';
const REGION = 'eu-east-7';

let deployment = new Deployment({
  id: '00000000-0000-0000-0000-000000000001',
  environmentName: ENVIRONMENT_NAME,
  environmentTypeName: 'Prod',
  serverRole: 'Web',
  serverRoleName: 'Web',
  serviceName: SERVICE_NAME,
  serviceVersion: '1.2.3',
  serviceSlice: 'blue',
  clusterName: 'Tango',
  accountName: ACCOUNT_NAME,
  username: 'test-user'
});

let COMMAND = {
  name: 'ProvideInfrastructure',
  deployment,
  accountName: ACCOUNT_NAME
};

let expectedConfiguration = {
  environmentName: ENVIRONMENT_NAME,
  serverRole: { FleetPerSlice: false, AutoScalingSettings: { DesiredCapacity: 2 } }
};

describe('GetInfrastructureRequirements:', () => {
  let mocks;

  function createTarget() {
    mocks = {
      infrastructureConfigurationProvider: {
        get: sinon.stub().returns(Promise.resolve())
      },
      launchConfigurationTemplatesProvider: {
        get: sinon.stub().returns(Promise.resolve([]))
      },
      autoScalingTemplatesProvider: {
        get: sinon.stub().returns(Promise.resolve())
      },
      AsgResource: {
        get: sinon.stub().returns(Promise.resolve())
      },
      ScanAutoScalingGroups: sinon.stub().returns(Promise.resolve([])),
      ScanLaunchConfigurations: sinon.stub().returns(Promise.resolve([])),
      awsPartitions: {
        getPartitionForEnvironment: sinon.stub().returns(Promise.resolve({
          accountId: ACCOUNT_ID,
          region: 'eu-east-7'
        }))
      },
      CreateAutoScalingGroup: sinon.stub().returns(Promise.resolve())
    };

    let mod = proxyquire('commands/deployments/GetInfrastructureRequirements', {
      'modules/amazon-client/awsPartitions': mocks.awsPartitions,
      'modules/provisioning/autoScalingTemplatesProvider': mocks.autoScalingTemplatesProvider,
      'modules/provisioning/infrastructureConfigurationProvider': mocks.infrastructureConfigurationProvider,
      'modules/provisioning/launchConfigurationTemplatesProvider': mocks.launchConfigurationTemplatesProvider,
      'modules/resourceFactories/AsgResource': mocks.AsgResource,
      'queryHandlers/ScanAutoScalingGroups': mocks.ScanAutoScalingGroups,
      'queryHandlers/ScanLaunchConfigurations': mocks.ScanLaunchConfigurations
    });
    return mod;
  }

  describe('Multi ASG mode deployment', () => {
    let promise = null;

    const BLUE_ASG = 'pr1-ta-Web-blue';
    const GREEN_ASG = 'pr1-ta-Web-green';

    before(() => {
      let target = createTarget();
      expectedConfiguration.serverRole.FleetPerSlice = true;

      mocks.infrastructureConfigurationProvider.get
        .returns(Promise.resolve(expectedConfiguration));

      mocks.autoScalingTemplatesProvider.get
        .returns(Promise.resolve([{ autoScalingGroupName: GREEN_ASG }, { autoScalingGroupName: BLUE_ASG }]));

      promise = target(COMMAND);
    });

    after(() => {
      expectedConfiguration.serverRole.FleetPerSlice = false;
    });

    it('should only query the target ASG', () =>
      promise.then(() => {
        sinon.assert.calledOnce(mocks.ScanAutoScalingGroups);
        sinon.assert.calledWithExactly(mocks.ScanAutoScalingGroups, { accountId: ACCOUNT_ID, autoScalingGroupNames: [BLUE_ASG] });
      })
    );
  });

  describe('when an AutoScalingGroup and its LaunchConfiguration are expected', () => {
    describe('and AutoScalingGroup already exists on AWS', () => {
      let promise = null;

      let expectedLaunchConfigurationTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      // Mocking AutoScalingTemplatesProvider

      let expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));


        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider
        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender
        let expectedAutoScalingGroup = {
          AutoScalingGroupName: 'pr1-ta-Web'
        };

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([expectedAutoScalingGroup]));

        promise = target(COMMAND);
      });

      beforeEach(() => {
        return promise;
      });

      it('should get configuration for environment and service', () => {
        sinon.assert.calledWith(mocks.infrastructureConfigurationProvider.get, ENVIRONMENT_NAME, SERVICE_NAME);
      });

      it('should get AutoScaling templates for configuration', () => {
        sinon.assert.calledWith(mocks.autoScalingTemplatesProvider.get, expectedConfiguration, ACCOUNT_ID);
      });

      it('should not get LaunchConfiguration templates', () => {
        sinon.assert.notCalled(mocks.launchConfigurationTemplatesProvider.get);
      });

      it('should check the AutoScalingGroup presence', () => {
        sinon.assert.calledWith(mocks.ScanAutoScalingGroups, { accountId: ACCOUNT_ID, autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName] });
      });

      it('should not check the LaunchConfiguration presence', () => {
        sinon.assert.notCalled(mocks.ScanLaunchConfigurations);
      });
    });

    describe('and AutoScalingGroup and its LaunchConfiguration do not exist on AWS', () => {
      let promise = null;
      let expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      let expectedLaunchConfigurationTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        promise = target(COMMAND);
      });

      it('should get AutoScaling templates for configuration', () =>
        promise.then(() => {
          sinon.assert.calledWith(mocks.autoScalingTemplatesProvider.get, expectedConfiguration, ACCOUNT_ID);
        })
      );

      it('should check the AutoScalingGroup presence', () =>
        promise.then(() => {
          sinon.assert.calledWith(mocks.ScanAutoScalingGroups, { accountId: ACCOUNT_ID, autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName] });
        }));

      it('should check the LaunchConfiguration presence', () =>
        promise.then(() => {
          sinon.assert.alwaysCalledWith(mocks.ScanLaunchConfigurations, { accountName: ACCOUNT_ID, launchConfigurationNames: [expectedAutoScalingTemplate.launchConfigurationName] });
        }));

      it('should get LaunchConfiguration templates for configuration', () =>
        promise.then(() => {
          sinon.assert.calledWith(
            mocks.launchConfigurationTemplatesProvider.get,
            expectedConfiguration,
            ACCOUNT_ID
          );
        })
      );
    });

    describe('and AutoScalingGroup does not exist but its LaunchConfiguration does', () => {
      let promise = null;

      let expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        // Mocking AutoScalingTemplatesProvider
        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        // Mocking LaunchConfigurationTemplatesProvider
        let expectedLaunchConfigurationTemplate = {
          image: { rootVolumeSize: 10 },
          devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
          launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
        };

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        // Mocking Sender
        let expectedLaunchConfiguration = {
          LaunchConfigurationName: 'LaunchConfig_pr1-ta-Web'
        };

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([]));

        mocks.ScanLaunchConfigurations.returns(Promise.resolve([expectedLaunchConfiguration]));

        promise = target(COMMAND);
      });

      it('should get AutoScaling templates for configuration', () =>
        promise.then(() =>
          sinon.assert.calledWith(
            mocks.autoScalingTemplatesProvider.get,
            expectedConfiguration,
            ACCOUNT_ID
          )
        )
      );

      it('should check the AutoScalingGroup presence', () =>
        promise.then(() =>
          sinon.assert.calledWith(
            mocks.ScanAutoScalingGroups,
            { accountId: ACCOUNT_ID, autoScalingGroupNames: [expectedAutoScalingTemplate.autoScalingGroupName] })));

      it('should check the LaunchConfiguration presence', () =>
        promise.then(() =>
          sinon.assert.calledWith(
            mocks.ScanLaunchConfigurations,
            { accountName: ACCOUNT_ID, launchConfigurationNames: [expectedAutoScalingTemplate.launchConfigurationName] })));

      it('should not get LaunchConfiguration templates', () =>
        promise.then(() =>
          sinon.assert.notCalled(mocks.launchConfigurationTemplatesProvider.get)));
    });

    describe('and AutoScalingGroup and its LaunchConfiguration do not exist but an AutoScalingGroupAlreadyExistsError has thrown', () => {
      let promise = null;
      let expectedAutoScalingTemplate = {
        autoScalingGroupName: 'pr1-ta-Web',
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingTemplate]));

        let expectedLaunchConfigurationTemplate = {
          image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web'
        };

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([expectedLaunchConfigurationTemplate]));

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([]));
        mocks.ScanLaunchConfigurations.returns(Promise.resolve([]));

        mocks.CreateAutoScalingGroup.returns(Promise.reject(new AutoScalingGroupAlreadyExistsError()));

        promise = target(COMMAND);
      });

      it('should ignore the error and return a fulfilled promise anyway', () => promise);
    });
  });

  describe('when blue/green AutoScalingGroups and their LaunchConfigurations are expected', () => {
    describe('and both AutoScalingGroups already exist on AWS', () => {
      let promise = null;
      let expectedLaunchConfigurationBlueTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedLaunchConfigurationGreenTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      let expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([expectedAutoScalingBlueTemplate, expectedAutoScalingGreenTemplate]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate
          ]));

        let expectedAutoScalingGroupBlue = {
          AutoScalingGroupName: 'pr1-ta-Web-blue'
        };

        let expectedAutoScalingGroupGreen = {
          AutoScalingGroupName: 'pr1-ta-Web-green'
        };

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([
          expectedAutoScalingGroupBlue,
          expectedAutoScalingGroupGreen
        ]));

        promise = target(COMMAND);
      });

      it('should check the AutoScalingGroup presence', () =>
        promise.then(() =>
          sinon.assert.alwaysCalledWith(
            mocks.ScanAutoScalingGroups,
            {
              accountId: ACCOUNT_ID,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName
              ]
            })));

      it('should not check the LaunchConfiguration presence', () =>
        promise.then(() =>
          sinon.assert.notCalled(mocks.ScanLaunchConfigurations)));
    });

    describe('and only blue AutoScalingGroup and blue LaunchConfiguration exist on AWS', () => {
      let promise = null;
      let expectedLaunchConfigurationBlueTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedLaunchConfigurationGreenTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      let expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();

        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([
            expectedAutoScalingBlueTemplate,
            expectedAutoScalingGreenTemplate
          ]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate
          ]));

        let expectedAutoScalingGroupBlue = {
          AutoScalingGroupName: 'pr1-ta-Web-blue'
        };

        let expectedLaunchConfigurationBlue = {
          image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
        };

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([expectedAutoScalingGroupBlue]));

        mocks.ScanLaunchConfigurations.returns(Promise.resolve([expectedLaunchConfigurationBlue]));

        promise = target(COMMAND);
      });

      it('should check the AutoScalingGroups presence', () =>
        promise.then(() =>
          sinon.assert.alwaysCalledWith(
            mocks.ScanAutoScalingGroups,
            {
              accountId: ACCOUNT_ID,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName
              ]
            })));

      it('should check green LaunchConfiguration presence only', () =>
        promise.then(() =>
          sinon.assert.alwaysCalledWith(
            mocks.ScanLaunchConfigurations,
            {
              accountName: ACCOUNT_ID,
              launchConfigurationNames: [expectedAutoScalingGreenTemplate.launchConfigurationName]
            })));
    });

    describe('and both AutoScalingGroups do not exist on AWS', () => {
      let promise = null;

      // Mocking AutoScalingTemplatesProvider
      let expectedAutoScalingBlueTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-blue',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedAutoScalingGreenTemplate = {
        autoScalingGroupName: 'pr1-ta-Web-green',
        image: { rootVolumeSize: 10 },
        devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }],
        launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      let expectedLaunchConfigurationBlueTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-blue'
      };

      let expectedLaunchConfigurationGreenTemplate = {
        image: { rootVolumeSize: 10 }, devices: [{ DeviceName: '/dev/sda1', Ebs: { VolumeSize: 20 } }], launchConfigurationName: 'LaunchConfig_pr1-ta-Web-green'
      };

      before('Providing the infrastructure', () => {
        let target = createTarget();

        // Mocking ConfigurationProvider
        mocks.infrastructureConfigurationProvider.get
          .returns(Promise.resolve(expectedConfiguration));

        mocks.autoScalingTemplatesProvider.get
          .returns(Promise.resolve([
            expectedAutoScalingBlueTemplate,
            expectedAutoScalingGreenTemplate
          ]));

        mocks.launchConfigurationTemplatesProvider.get
          .returns(Promise.resolve([
            expectedLaunchConfigurationBlueTemplate,
            expectedLaunchConfigurationGreenTemplate
          ]));

        mocks.ScanAutoScalingGroups.returns(Promise.resolve([]));

        mocks.ScanLaunchConfigurations.returns(Promise.resolve([]));

        promise = target(COMMAND);
      });

      it('should check the AutoScalingGroup presence', () =>
        promise.then(() =>
          sinon.assert.alwaysCalledWith(
            mocks.ScanAutoScalingGroups,
            {
              accountId: ACCOUNT_ID,
              autoScalingGroupNames: [
                expectedAutoScalingBlueTemplate.autoScalingGroupName,
                expectedAutoScalingGreenTemplate.autoScalingGroupName
              ]
            })));

      it('should check the LaunchConfiguration presence', () =>
        promise.then(() =>
          sinon.assert.alwaysCalledWith(
            mocks.ScanLaunchConfigurations,
            {
              accountName: ACCOUNT_ID,
              launchConfigurationNames: [
                expectedAutoScalingBlueTemplate.launchConfigurationName,
                expectedAutoScalingGreenTemplate.launchConfigurationName
              ]
            })));
    });
  });
});
