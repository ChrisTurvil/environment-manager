'use strict';

let Promise = require('bluebird');
let receiver = require('./receiver');
let log = require('../log');

function foreverAsync(cancel, fn, init) {
  return cancel
    ? Promise.resolve(init)
    : Promise.resolve(init)
      .then(fn)
      .then(result => foreverAsync(cancel, fn, result));
}

function start(workQueueUrl) {
  let cancel = false;
  let receiveForeverP = foreverAsync(cancel, () => receiver.receive(workQueueUrl).catch(log));
  return {
    promise: receiveForeverP,
    stop() {
      cancel = true;
      return receiveForeverP;
    }
  };
}

module.exports = {
  start
};
