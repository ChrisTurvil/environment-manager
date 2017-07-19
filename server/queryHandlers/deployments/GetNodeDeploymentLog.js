/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let S3GetObjectRequest = require('modules/S3GetObjectRequest');
let { createS3Client } = require('modules/amazon-client/childAccountClient');
let { getPartitionsForEnvironment } = require('modules/amazon-client/awsConfiguration');
let { account } = require('modules/amazon-client/partition');
let sender = require('modules/sender');

function getNode({ deploymentId, instanceId, environment }) {
  let partitionP = getPartitionsForEnvironment(environment);
  let nodeP = partitionP
    .then(partition => ({
      name: 'GetTargetState',
      key: `deployments/${deploymentId}/nodes/${instanceId}`,
      accountName: account(partition),
      environment,
      recurse: false
    })).then(query => sender.sendQuery({ query }));
  return Promise.join(partitionP, nodeP, (partition, node) => {
    let s3Details = parseBucketAndPathFromS3Url(node.value.Log);
    return fetchS3Object(partition, s3Details);
  })
    .catch((error) => {
      if (error.message.match(/Key.*has not been found/)) {
        throw new Error(`The service deployment ${deploymentId} hasn\'t started on instance ${instanceId}.`);
      } else throw error;
    });
}

function fetchS3Object(partition, s3Details) {
  return createS3Client(partition).then((client) => {
    let s3Request = new S3GetObjectRequest(client, s3Details);
    return s3Request.execute()
      .then(result => result.Body.toString());
  });
}

function parseBucketAndPathFromS3Url(url) {
  let r = /:\/\/(.*?)\..*?\/(.*)\?/g;
  let matches = r.exec(url);

  if (matches) {
    return {
      bucketName: matches[1],
      objectPath: matches[2]
    };
  } else {
    return null;
  }
}

module.exports = getNode;
