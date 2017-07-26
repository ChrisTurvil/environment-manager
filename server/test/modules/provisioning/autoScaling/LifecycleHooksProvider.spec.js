/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire').noCallThru();

let LifecycleHookType = require('Enums').LifecycleHookType;
let LifecycleHookDefaultResult = require('Enums').LifecycleHookDefaultResult;

describe('LifecycleHooksProvider: ', () => {
  let accountName = 'Prod';

  let expectedIAMRole = {
    RoleName: 'roleInfraAsgScale',
    Arn: 'arn:aws:iam::000000000001:role/roleInfraAsgScale'
  };

  let expectedTopic = {
    TopicArn: 'arn:aws:sns:eu-west-1:000000000001:InfraAsgLambdaScale'
  };

  let GetRole = sinon.stub();
  let GetTopic = sinon.stub();
  const lifecycleHooksProvider = proxyquire(
    'modules/provisioning/autoScaling/lifecycleHooksProvider',
    {
      'queryHandlers/GetRole': GetRole,
      'queryHandlers/GetTopic': GetTopic
    }
  );

  GetRole.returns(Promise.resolve(expectedIAMRole));

  GetTopic.returns(Promise.resolve(expectedTopic));

  let promise;

  before(() => {
    let target = lifecycleHooksProvider;
    promise = target.get(accountName);
  });

  it('should be possible to obtain a lifecycle hook', () => {
    return promise.then((lifecycleHooks) => {
      should(lifecycleHooks).not.be.undefined();
      should(lifecycleHooks).be.Array();

      lifecycleHooks[0].should.match({
        name: '10min-draining',
        type: LifecycleHookType.InstanceTerminating,
        roleArn: expectedIAMRole.Arn,
        topicArn: expectedTopic.TopicArn,
        defaultResult: LifecycleHookDefaultResult.Continue,
        heartbeatTimeout: '10m'
      });
    });
  });

  it('should be possible to obtain the roleInfraAsgScale Role Arn', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        GetRole,
        {
          accountName,
          roleName: 'roleInfraAsgScale'
        }
      )));

  it('should be possible to obtain the InfraAsgLambdaScale Topic Arn', () =>
    promise.then(() =>
      sinon.assert.calledWith(
        GetTopic,
        {
          accountName,
          topicName: 'InfraAsgLambdaScale'
        }
      )));
});
