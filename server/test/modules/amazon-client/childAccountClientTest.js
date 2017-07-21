'use strict';

require('should');
const proxyquire = require('proxyquire').noCallThru();

function SomeConstructor(data) {
  Object.assign(this, data);
}

function withCannedGetAccountByNameResponse(account) {
  return proxyquire('modules/amazon-client/childAccountClient', {
    'aws-sdk': {
      DynamoDB: {
        DocumentClient: SomeConstructor
      }
    },
    'modules/amazon-client/awsCredentials': {
      getCredentialsForRole: data => Promise.resolve(data)
    },
    'modules/awsAccounts': {
      getByName: () => Promise.resolve(account)
    }
  });
}

describe('childAccountClient', function () {
  context('with a child account', function () {
    let sut = withCannedGetAccountByNameResponse({ Impersonate: true, RoleArn: 'my-role-arn' });
    it('creates a client with explicit credentials', function () {
      sut.createDynamoClient('').should.finally.eql(new SomeConstructor({ credentials: 'my-role-arn' }));
    });
  });
  context('with a child account and region', function () {
    let sut = withCannedGetAccountByNameResponse({ Impersonate: true, RoleArn: 'my-role-arn' });
    it('creates a client with explicit credentials and region', function () {
      sut.createDynamoClient('', 'my-region').should.finally.eql(new SomeConstructor({ credentials: 'my-role-arn', region: 'my-region' }));
    });
  });
  context('with a child account', function () {
    let sut = withCannedGetAccountByNameResponse({ Impersonate: false, RoleArn: 'my-role-arn' });
    it('creates a client with implicit credentials', function () {
      sut.createDynamoClient('').should.finally.eql(new SomeConstructor({}));
    });
  });
});
