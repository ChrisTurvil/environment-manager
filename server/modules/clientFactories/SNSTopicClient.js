/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let AwsError = require('modules/errors/AwsError.class');
let TopicNotFoundError = require('modules/errors/TopicNotFoundError.class');
let config = require('config');
let { account } = require('modules/amazon-client/partition');
let { createSNSClient } = require('modules/amazon-client/childAccountClient');

const AWS_REGION = config.get('EM_AWS_REGION');

module.exports = function SNSTopicClient(partition) {
  this.get = function (parameters) {
    return co(function* () {
      let topicArn = yield getTopicArnByConvention(parameters.topicName, partition);
      let client = yield createSNSClient(partition);
      let topic = yield client.getTopicAttributes({ TopicArn: topicArn }).promise().then(
        response => Promise.resolve(response.Attributes),
        error => Promise.reject(error.code === 'NotFound' ?
          new TopicNotFoundError(`Topic '${parameters.topicName}' not found.`)
          : new AwsError(error.message))
      );
      return topic;
    });
  };

  function getTopicArnByConvention(topicName, { region, roleArn }) {
    let topicArn = `arn:aws:sns:${region}:${account(roleArn)}:${topicName}`;
    return Promise.resolve(topicArn);
  }
};
