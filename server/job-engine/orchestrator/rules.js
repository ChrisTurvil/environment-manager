'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let jobsDb = require('./jobs-db');
let log = require('../log');
let now = require('../now');
let { getBlockedTasks, getRunnableTasks } = require('./taskGraph');
let { terminalStates, STATUS: { pending, queued, running, completed, failed } } = require('../task');

let SampleJob = {
  JobId: '123',
  Status: pending,
  Tasks: {
    Deploy1: {
      ExpiresAt: 1505307558291,
      Command: 'deploy/v1',
      Seq: 3,
      Status: running,
      Result: null
    },
    Toggle1: {
      DependsOn: ['Deploy1'],
      ExpiresAt: 1505307558291,
      Command: 'toggle/v1',
      Seq: 0,
      Status: pending,
      Result: null
    }
  }
};

let sqs = new AWS.SQS();

function goal({ Status }) {
  return terminalStates.some(s => s === Status);
}

function isExpired(task) {
  let { ExpiresAt } = task;
  return Number.isInteger(ExpiresAt) && now() < ExpiresAt;
}

function hasRunnableTasks({ Tasks }) {
  return getRunnableTasks(Tasks).some();
}

function enqueueTasks({ JobId, Tasks }) {
  function enqueueTask() {
    // Construct the message
    // Send the message
    // Mark the task as queued
  }
  return Promise.map(getRunnableTasks(Tasks), enqueueTask);
}

let jobRules = [
  [hasRunnableTasks, enqueueTasks]
  [hasNoReachableTasks, terminateJob]
];

