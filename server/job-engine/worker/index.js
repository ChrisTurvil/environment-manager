'use strict';

let Promise = require('bluebird');
let receiver = require('./receiver');
let log = require('../log');

function foreverAsync(cancellationToken, fn, init) {
  return cancellationToken.cancel
    ? Promise.resolve(init)
    : Promise.resolve(init)
      .then(fn)
      .then(result => foreverAsync(cancellationToken, fn, result));
}

function start(workQueueUrl) {
  let cancellationToken = { cancel: false };
  let receiveForeverP = foreverAsync(cancellationToken, () => receiver.receive(workQueueUrl).catch(log));
  return {
    promise: receiveForeverP,
    stop() {
      cancellationToken.cancel = true;
      return receiveForeverP;
    }
  };
}

module.exports = {
  start
};
