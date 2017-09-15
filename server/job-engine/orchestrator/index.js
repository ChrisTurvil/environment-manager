'use strict';

let Promise = require('bluebird');
let forever = require('../forever');
let listen = require('../listen');
let jobsDb = require('./jobs-db');
let receiver = require('./receiver');
let rules = require('./rules');
let log = require('../log');

const ORCHESTRATOR_RULES_PERIOD = 5000;

function start(jobsTable, orchestratorQueueUrl, workQueueUrl) {
  const JobsDb = jobsDb({ TableName: jobsTable });

  function converge() {
    let activeJobsP = JobsDb.scanActive().catch((error) => { log(error); return []; });
    function runActions(actions) {
      return Promise.map(action => action({ jobsDb: JobsDb, orchestratorQueueUrl, workQueueUrl }).catch(log));
    }
    return Promise.map(activeJobsP, job => rules.apply(job).catch((error) => { log(error); return []; }).then(runActions))
      .then(() => Promise.delay(ORCHESTRATOR_RULES_PERIOD));
  }

  let cancellationToken = { cancel: false };
  let convergeForeverP = forever(cancellationToken, () => converge().catch(log));
  let receiveForeverP = listen(cancellationToken, orchestratorQueueUrl, receiver({ JobsDb }));
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
