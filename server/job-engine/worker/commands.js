'use strict';

let Promise = require('bluebird');
let { isTerminalState, STATUS: { running, completed, failed } } = require('../task');
let {
  TaskStarted,
  TaskCompleted,
  TaskFailed
} = require('../message');

module.exports = {
  'echo/v1': ({ Message }) => Promise.delay(5000).then(() => ({ Message }))
};
