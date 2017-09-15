'use strict';

let Promise = require('bluebird');
let { MESSAGE_TYPE: { NewJob, TaskStarted, TaskCompleted, TaskFailed } } = require('../message');

function create({ JobsDb }) {
  function onNewJob(job) {
    return JobsDb.insertJob(job);
  }

  function onTaskStarted({ JobId, TaskId, Seq, Status, Result }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
  }

  function onTaskCompleted({ JobId, TaskId, Seq, Status, Result }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
  }

  function onTaskFailed({ JobId, TaskId, Seq, Status, Result }) {
    return JobsDb.updateTask(JobId, TaskId, { Seq, Status, Result });
  }

  function processMessage(message) {
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

  return processMessage;
}

module.exports = create;
