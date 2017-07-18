/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('uuid/v1');
let AWS = require('aws-sdk');

function getCredentials(roleARN) {
  return assumeRole(roleARN).then(response =>
    new AWS.Credentials(
      response.Credentials.AccessKeyId,
      response.Credentials.SecretAccessKey,
      response.Credentials.SessionToken
    )
  );
}

function assumeRole(roleARN) {
  let stsClient = new AWS.STS();
  let stsParameters = {
    RoleArn: roleARN,
    RoleSessionName: guid()
  };
  return stsClient.assumeRole(stsParameters).promise();
}

function createWithOptions(Ctor) {
  return ({ region, roleArn } = {}) => {
    let credentialsP = roleArn !== undefined
      ? getCredentials(roleArn).then(credentials => ({ credentials }))
      : Promise.resolve({});
    let role = region !== undefined
      ? ({ region })
      : ({});
    return credentialsP
      .then(Object.assign.bind(null, role))
      .then(options => new Ctor(options));
  };
}

module.exports = {
  createLowLevelDynamoClient: createWithOptions(AWS.DynamoDB),
  createDynamoClient: createWithOptions(AWS.DynamoDB.DocumentClient),
  createASGClient: createWithOptions(AWS.AutoScaling),
  createEC2Client: createWithOptions(AWS.EC2),
  createIAMClient: createWithOptions(AWS.IAM),
  createS3Client: createWithOptions(AWS.S3),
  createSNSClient: createWithOptions(AWS.SNS),
  assumeRole
};
