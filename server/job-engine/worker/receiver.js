'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let log = require('../log');
let { STATUS: { failed } } = require('../task');
const { MESSAGE_TYPE: { RunTask, TaskFailed } } = require('../message');
let commands = require('./commands');

let sqs = new AWS.SQS();

function onRunTask(message) {
  let { JobId, TaskId, Command, ReplyTo, Seq } = message;

  function reply(content) {
    return Promise.resolve().then(() => {
      let params = {
        MessageBody: JSON.stringify(Object.assign(content, { JobId, TaskId, Seq: Seq + 1 })),
        QueueUrl: ReplyTo
      };
      return sqs.sendMessage(params).promise();
    });
  }

  function execute(command) {
    return (command === undefined)
      ? Promise.reject(new Error(`Unknown command: ${command}`))
      : Promise.resolve(message).then(command);
  }

  return Promise.resolve(commands[Command])
    .then(execute)
    .catch(error => ({ Type: TaskFailed, Status: failed, Result: `${error}` }))
    .then(reply);
}

function process(message) {
  return Promise.resolve().then(() => {
    let messageObj = JSON.parse(message);
    let { Type } = messageObj;
    switch (Type) {
      case RunTask:
        return onRunTask(messageObj);
      default:
        return Promise.reject(new Error(`Unknown message type: ${Type}`));
    }
  });
}

function receive(QueueUrl) {
  let params = {
    QueueUrl,
    WaitTimeSeconds: 20
  };

  function receiveOne(message) {
    return Promise.resolve(message)
      .then(log)
      .then(({ Body }) => process(Body))
      .then(() => message)
      .then(({ ReceiptHandle }) => sqs.deleteMessage({ QueueUrl, ReceiptHandle }).promise())
      .catch(log);
  }

  return sqs.receiveMessage(params)
    .promise()
    .then(({ Messages = [] }) => Promise.map(Messages, receiveOne));
}

module.exports = {
  receive
};
