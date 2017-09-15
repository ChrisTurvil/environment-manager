'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
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

function processMessage(message) {
  let { Type } = message;
  switch (Type) {
    case RunTask:
      return onRunTask(message);
    default:
      return Promise.reject(new Error(`Unknown message type: ${Type}`));
  }
}

module.exports = processMessage;
