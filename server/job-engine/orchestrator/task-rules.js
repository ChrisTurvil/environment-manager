'use strict';

let AWS = require('aws-sdk');
let fp = require('lodash/fp');
let now = require('../now');
let { isTerminalState, STATUS: { pending, queued, completed, failed } } = require('../task');

let sqs = new AWS.SQS();

function goal({ Status }) {
  return isTerminalState(Status);
}

function isExpired({ LastModified, Status, TTL }) {
  return !isTerminalState(Status) && LastModified + TTL < now();
}

function isRunnable({ DependsOn = [], Status }, { Tasks }) {
  return Status === pending && DependsOn.all(dependency => Tasks[dependency].Status === completed);
}

function isBlocked({ DependsOn = [], Status }, { Tasks }) {
  return !isTerminalState(Status) && DependsOn.some(dependency => Tasks[dependency].Status === failed);
}

function enqueueTask(TaskId, { Args, Command, Seq }, { JobId }) {
  return [({ jobsDb, orchestratorQueueUrl, workQueueUrl }) => {
    let seq = Seq + 1;
    let params = {
      MessageBody: JSON.stringify({
        JobId,
        TaskId,
        Command,
        Args,
        ReplyTo: orchestratorQueueUrl,
        Seq: seq
      }),
      QueueUrl: workQueueUrl
    };
    return sqs.sendMessage(params).promise()
      .then(() => jobsDb.updateTask(JobId, TaskId, { Seq, Status: queued }));
  }];
}

function markExpired(taskId, { Seq }, { JobId }) {
  return [({ jobsDb }) => jobsDb.updateTask(JobId, taskId, { Seq: Seq + 1, Status: failed, Result: 'Error: The task exceeded its TTL' })];
}

function markBlocked(taskId, { Seq }, { JobId }) {
  return [({ jobsDb }) => jobsDb.updateTask(JobId, taskId, { Seq: Seq + 1, Status: failed, Result: 'Error: The task exceeded its TTL' })];
}

let taskRules = [
  [isRunnable, enqueueTask],
  [isExpired, markExpired],
  [isBlocked, markBlocked]
];

function forJob(job) {
  function apply([taskId, task]) {
    return goal(task)
      ? []
      : fp.flow(
        fp.filter(([predicate]) => predicate(task, job)),
        fp.map(action => action(taskId, task, job)),
        fp.flatten
      )(taskRules);
  }

  return { apply };
}

module.exports = forJob;
