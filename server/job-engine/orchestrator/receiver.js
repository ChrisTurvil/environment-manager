'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let jobsDb = require('./jobs-db');
let log = require('../log');
let {
  NewJob,
  TaskStarted,
  TaskCompleted,
  TaskFailed
} = require('../message');

let sqs = new AWS.SQS();

function onNewJob(job) {
  return jobsDb.insertJob(job);
}

function onTaskStarted({ JobId, TaskId, Seq, Status, Result }) {
  return jobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
}

function onTaskCompleted({ JobId, TaskId, Seq, Status, Result }) {
  return jobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
}

function onTaskFailed({ JobId, TaskId, Seq, Status, Result }) {
  return jobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
}

function process(message) {
  let { Type } = message;
  switch (Type) {
    case NewJob:
      return onNewJob(message.Job);
    case TaskStarted:
      return onTaskStarted(message);
    case TaskCompleted:
      return onTaskCompleted(message);
    case TaskFailed:
      return onTaskFailed(message);
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
