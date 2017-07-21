/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let AWS = require('aws-sdk');
let awsAccounts = require('modules/awsAccounts');
let { getCredentialsForRole } = require('modules/amazon-client/awsCredentials');

function createClientWithRole(ClientConstructor) {
  return (accountName, region) => {
    let regionP = Promise.resolve(region !== undefined ? { region } : {});
    let credentialsP = awsAccounts.getByName(accountName)
      .then(({ Impersonate, RoleArn }) => (Impersonate && RoleArn !== undefined
        ? getCredentialsForRole(RoleArn).then(credentials => ({ credentials }))
        : Promise.resolve({})));
    return Promise.all([credentialsP, regionP])
      .then(args => Object.assign(...[{}, ...args]))
      .then(options => new ClientConstructor(options));
  };
}

module.exports = {
  createLowLevelDynamoClient: createClientWithRole(AWS.DynamoDB),
  createDynamoClient: createClientWithRole(AWS.DynamoDB.DocumentClient),
  createASGClient: createClientWithRole(AWS.AutoScaling),
  createEC2Client: createClientWithRole(AWS.EC2),
  createIAMClient: createClientWithRole(AWS.IAM),
  createS3Client: createClientWithRole(AWS.S3),
  createSNSClient: createClientWithRole(AWS.SNS)
};
