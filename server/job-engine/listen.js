'use strict';

let forever = require('./forever');
let AWS = require('aws-sdk');
let Promise = require('bluebird');
let sqs = new AWS.SQS();
let log = require('./log');

function receive(QueueUrl, processMessage) {
  log('receiving');
  let params = {
    QueueUrl,
    WaitTimeSeconds: 2
  };

  function receiveOne(message) {
    return Promise.resolve(message)
      .then(({ Body }) => processMessage(JSON.parse(Body)))
      .then(() => message)
      .then(({ ReceiptHandle }) => sqs.deleteMessage({ QueueUrl, ReceiptHandle }).promise())
      .catch(log);
  }

  return sqs.receiveMessage(params)
    .promise()
    .then(({ Messages = [] }) => Promise.map(Messages, receiveOne));
}

function listen(cancellationToken, QueueUrl, processMessage) {
  // return forever(cancellationToken, receive(QueueUrl, processMessage).catch(log));
  return Promise.resolve();
}

module.exports = listen;
