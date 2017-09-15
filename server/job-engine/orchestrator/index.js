'use strict';

let Promise = require('bluebird');
let jobsDb = require('./jobs-db');
let receiver = require('./receiver');
let rules = require('./rules');
let log = require('../log');

const ORCHESTRATOR_RULES_PERIOD = 5000;

function foreverAsync(cancellationToken, fn, init) {
  return cancellationToken.cancel
    ? Promise.resolve(init)
    : Promise.resolve(init)
      .then(fn)
      .then(result => foreverAsync(cancellationToken, fn, result));
}

function converge(receiveQueueUrl, workQueueUrl) {
  let activeJobsP = jobsDb.scanActive().catch((error) => { log(error); return []; });
  function runActions(actions) {
    return Promise.map(action => action({ jobsDb, receiveQueueUrl, workQueueUrl }).catch(log));
  }
  return Promise.map(activeJobsP, job => rules.apply(job).catch((error) => { log(error); return []; }).then(runActions))
    .then(() => Promise.delay(ORCHESTRATOR_RULES_PERIOD));
}

function start(receiveQueueUrl, workQueueUrl) {
  let cancellationToken = { cancel: false };
  let receiveForeverP = foreverAsync(cancellationToken, () => receiver.receive(receiveQueueUrl).catch(log));
  let convergeForeverP = foreverAsync(cancellationToken, () => converge(receiveQueueUrl, workQueueUrl).catch(log));
  let runningP = Promise.all([receiveForeverP, convergeForeverP]);
  return {
    promise: runningP,
    stop() {
      cancellationToken.cancel = true;
      return runningP;
    }
  };
}

module.exports = {
  start
};
