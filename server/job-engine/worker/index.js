'use strict';

let Promise = require('bluebird');
let listen = require('../listen');
let receiver = require('./receiver');

function start(workQueueUrl) {
  let cancellationToken = { cancel: false };
  let receiveForeverP = listen(cancellationToken, workQueueUrl, receiver);
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
