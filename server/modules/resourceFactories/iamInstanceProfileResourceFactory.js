/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { createIAMClient } = require('modules/amazon-client/childAccountClient');

let AwsError = require('modules/errors/AwsError.class');
let InstanceProfileNotFoundError = require('modules/errors/InstanceProfileNotFoundError.class');
let assert = require('assert');

function InstanceProfileResource(client) {
  this.client = client;

  this.get = function (parameters) {
    assert(parameters.instanceProfileName);

    let request = {
      InstanceProfileName: parameters.instanceProfileName
    };

    return client.getInstanceProfile(request).promise()
      .then(response => response.InstanceProfile)
      .catch((error) => {
        throw prettifyError(error, request);
      });
  };

  function prettifyError(error, request) {
    if (error.code === 'NoSuchEntity') {
      return new InstanceProfileNotFoundError(`Instance profile "${request.InstanceProfileName}" not found.`);
    } else {
      return new AwsError(`An error has occurred getting Iam instance profile: ${error.message}`);
    }
  }
}

module.exports = partition => createIAMClient(partition).then(client => new InstanceProfileResource(client));
