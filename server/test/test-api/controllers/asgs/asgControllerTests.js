'use strict';

let { mapValues } = require('lodash/fp');
let proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');

function mkreq(params) {
  return {
    swagger: {
      params: mapValues(x => ({ value: x }))(params)
    }
  };
}

function assertItCallsErrorCallbackWhenEnvironmentNotFound(req, handlerFunctionName) {
  context('when the requested environment does not exist', function () {
    let sut = proxyquire('api/controllers/asgs/asgController', {
      'modules/validate/rule/environmentExists': () => Promise.resolve({ error: 'invalid' })
    });
    it('it sends a response with a 400 status code', function () {
      let res = {
        status: sinon.stub().returns({ json: sinon.stub() })
      };
      return sut[handlerFunctionName](req, res)
        .then(() => sinon.assert.calledWith(res.status, '400'));
    });
  });
}

describe('asgController', function () {
  let req = mkreq({ account: 'my-account', body: {}, environment: 'my-env', name: 'my-name' });
  describe('getAsgByName', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgByName');
  });

  describe('getAsgs', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgs');
  });

  describe('getAsgIps', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgIps');
  });

  describe('getAsgLaunchConfig', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgLaunchConfig');
  });

  describe('getScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getScalingSchedule');
  });

  describe('deleteAsg', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'deleteAsg');
  });

  describe('putScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putScalingSchedule');
  });

  describe('putScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putScalingSchedule');
  });

  describe('putAsgSize', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putAsgSize');
  });

  describe('putAsgLaunchConfig', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putAsgLaunchConfig');
  });
});
