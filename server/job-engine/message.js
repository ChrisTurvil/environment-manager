'use strict';

const MessageType = {
  NewJob: 'NewJob',
  RunTask: 'RunTask',
  TaskStarted: 'TaskStarted',
  TaskCompleted: 'TaskCompleted',
  TaskFailed: 'TaskFailed'
};

module.exports = {
  MessageType
};
