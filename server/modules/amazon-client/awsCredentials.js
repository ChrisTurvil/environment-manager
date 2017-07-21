/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('uuid/v1');
let AWS = require('aws-sdk');

module.exports = {
  getCredentialsForRole
};

function getCredentialsForRole(roleARN) {
  return assumeRole(roleARN)
    .then(response =>
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
