'use strict';

const MessageType = {
  NewJob: 'NewJob',
  TaskStarted: 'TaskStarted',
  TaskCompleted: 'TaskCompleted',
  TaskFailed: 'TaskFailed'
};

// Common Message Fields
{
  Type
}

module.exports = {
  MessageType
};
