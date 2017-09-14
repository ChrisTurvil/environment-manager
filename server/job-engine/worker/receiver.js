'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let log = require('../log');
let { isTerminalState, STATUS: { running, completed, failed } } = require('../task');
let {
  RunTask,
  TaskStarted,
  TaskCompleted,
  TaskFailed
} = require('../message');
let commands = require('./commands');

let sqs = new AWS.SQS();

function onRunTask(message) {
  let {
    JobId,
    TaskId,
    Command,
    Args,
    ReplyTo,
    Seq } = message;

  return Promise.resolve()
    .then(() => {
      let params = {
        MessageBody: { Status: running, Type: TaskStarted },
        QueueUrl: ReplyTo
      };
      return sqs.sendMessage(params).promise();
    })
    .catch(log)
    .then(() => {
      let command = commands[Command];
      if (command === undefined) {
        return Promise.reject(new Error(`Unknown command: ${command}`));
      } else {
        return command(Args);
      }
    })
    .then(Result => ({ Result, Status: completed, Type: TaskFailed }))
    .catch(error => ({ Type: TaskFailed, Status: failed, Result: `${error}` }))
    .then((partialMessage) => {
      let MessageBody = Object.assign(partialMessage, { JobId, TaskId, Seq: Seq + 1 });
      let params = {
        MessageBody,
        QueueUrl: ReplyTo
      };
      return sqs.sendMessage(params).promise();
    });
}

function process(message) {
  let { Type } = message;
  switch (Type) {
    case RunTask:
      return onRunTask(message);
    default:
      return Promise.reject(new Error(`Unknown message type: ${Type}`));
  }
}

function receive(QueueUrl) {
  let params = {
    QueueUrl,
    WaitTimeSeconds: 20
  };
  return sqs.receiveMessage(params)
    .promise()
    .then(messages => Promise.map(messages, message => process(message)
      .then(({ ReceiptHandle }) => sqs.deleteMessage({ QueueUrl, ReceiptHandle }))
      .catch(log)));
}

module.exports = {
  receive
};
