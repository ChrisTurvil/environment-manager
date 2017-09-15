'use strict';

let AWS = require('aws-sdk');
let Promise = require('bluebird');
let { isTerminalState, STATUS: { running, completed, failed } } = require('../task');
let {
  TaskStarted,
  TaskCompleted,
  TaskFailed
} = require('../message');

module.exports = {
  'echo/v1': ({ Args: { Message } }) => Promise.delay(5000).then(() => ({ Result: Message, Status: completed, Type: TaskCompleted })),
  'timeout/v1': () => Promise.resolve({ Status: running, Type: TaskStarted })
};
