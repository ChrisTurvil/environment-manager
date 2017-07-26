/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire').noCallThru();
let KeyPairNotFoundError = require('modules/errors/KeyPairNotFoundError.class');

describe('KeyNameProvider:', () => {
  let environmentName = 'my-env';
  describe('when server role configuration has "ClusterKeyName" set', () => {
    it('should be possible to obtain it if really exists on AWS', () => {
      // Arrange
      let expectedKeyPair = { KeyName: 'CustomKeyPair' };

      let getKeyPair = sinon.stub().returns(Promise.resolve(expectedKeyPair));

      let configuration = {
        serverRole: {
          ClusterKeyName: 'CustomKeyPair'
        },
        cluster: {
          Name: 'Tango'
        },
        environmentName,
        environmentType: {
          AWSAccountName: 'Prod'
        }
      };

      // Act
      let target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
        'queryHandlers/GetKeyPair': getKeyPair
      });
      let promise = target.get(configuration);

      // Assert
      return promise.then((keyName) => {
        should(keyName).be.equal(expectedKeyPair.KeyName);

        getKeyPair.called.should.be.true();
        getKeyPair.getCall(0).args[0].should.match({
          environmentName,
          keyName: configuration.serverRole.ClusterKeyName
        });
      });
    });

    describe('and it does not exist in AWS', () => {
      it('should be possible to understand the error', () => {
        // Arrange
        let getKeyPair = sinon.stub().returns(Promise.reject(new KeyPairNotFoundError(
          'Key pair "CustomKeyPair" not found.')));

        let configuration = {
          serverRole: {
            ClusterKeyName: 'CustomKeyPair'
          },
          cluster: {
            Name: 'Tango'
          },
          environmentName,
          environmentType: {
            AWSAccountName: 'Prod'
          }
        };

        // Act
        let target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
          'queryHandlers/GetKeyPair': getKeyPair
        });
        let promise = target.get(configuration);

        // Assert
        return promise.catch(error =>
          error.toString().should.be.containEql('key pair specified in configuration') &&
          error.toString().should.be.containEql('Key pair "CustomKeyPair" not found')
        );
      });
    });
  });

  describe('when server role configuration has no "ClusterKeyName" set', () => {
    it('should be possible to obtain the one by convention if really exists on AWS', () => {
      // Arrange
      let expectedKeyPair = { KeyName: 'TangoProd' };

      let getKeyPair = sinon.stub().returns(Promise.resolve(expectedKeyPair));

      let configuration = {
        serverRole: {
          ClusterKeyName: null
        },
        cluster: {
          Name: 'Tango',
          KeyPair: 'ProdTango'
        },
        environmentName,
        environmentType: {
          AWSAccountName: 'Prod'
        }
      };

      // Act
      let target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
        'queryHandlers/GetKeyPair': getKeyPair
      });
      let promise = target.get(configuration);

      // Assert
      return promise.then((keyName) => {
        should(keyName).be.equal(expectedKeyPair.KeyName);

        getKeyPair.called.should.be.true();
        getKeyPair.getCall(0).args[0].should.match({
          environmentName,
          keyName: configuration.cluster.KeyPair
        });
      });
    });
  });

  it('when neither server role configuration nor Cluster have key pair set it should be possible to understand the error', () => {
    // Arrange
    let getKeyPair = sinon.stub().returns(Promise.reject(new KeyPairNotFoundError()));

    let configuration = {
      serverRole: {
        ClusterKeyName: null
      },
      cluster: {
        Name: 'Tango'
      },
      environmentName,
      environmentType: {
        AWSAccountName: 'Prod'
      }
    };

    // Act
    let target = proxyquire('modules/provisioning/launchConfiguration/keyNameProvider', {
      'queryHandlers/GetKeyPair': getKeyPair
    });
    let promise = target.get(configuration);

    // Assert
    return promise.catch(error =>
      error.toString().should.be.containEql('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration')
    );
  });
});

