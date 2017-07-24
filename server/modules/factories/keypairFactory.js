/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const { createEC2Client } = require('modules/amazon-client/childAccountClient');
let { getPartitionForEnvironment } = require('modules/amazon-client/awsPartitions');
const AwsError = require('modules/errors/AwsError.class');
const KeyPairNotFoundError = require('modules/errors/KeyPairNotFoundError.class');

class KeyPairResource {

  constructor(client) {
    this.client = client;
  }

  get({ keyName }) {
    let self = this;
    let request = {
      KeyNames: [keyName]
    };

    return self.client.describeKeyPairs(request).promise().then((response) => {
      if (response.KeyPairs.length) {
        return response.KeyPairs[0];
      } else {
        throw new KeyPairNotFoundError(`Key pair "${keyName}" not found.`);
      }
    }, (error) => {
      throw new AwsError(`An error has occurred describing EC2 key pairs: ${error.message}`);
    });
  }
}

function create({ environmentName }) {
  return getPartitionForEnvironment(environmentName)
    .then(({ accountId, region }) => createEC2Client(accountId, region))
    .then(client => new KeyPairResource(client));
}

module.exports = {
  create
};
