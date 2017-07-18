/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS = require('aws-sdk');

function createWithOptions(Ctor) {
  return ({ region } = {}) => (region !== undefined ? new Ctor({ region }) : new Ctor());
}

module.exports = {
  createLowLevelDynamoClient: createWithOptions(AWS.DynamoDB),
  createDynamoClient: createWithOptions(AWS.DynamoDB.DocumentClient),
  createASGClient: createWithOptions(AWS.AutoScaling),
  createEC2Client: createWithOptions(AWS.EC2),
  createIAMClient: createWithOptions(AWS.IAM),
  createS3Client: createWithOptions(AWS.S3),
  createSNSClient: createWithOptions(AWS.SNS)
};
