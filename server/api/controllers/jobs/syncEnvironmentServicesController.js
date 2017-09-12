'use strict';

let guid = require('uuid/v1');
let { runJob } = require('modules/environment-sync/sync-services');

function getSyncEnvironmentServicesJob(req, res, next) {
  next();
}

function getSyncEnvironmentServicesJobs(req, res, next) {
  next();
}

function postSyncEnvironmentServicesSe(req, res, next) {
  let serviceEnvironmentPairs = req.swagger.params.body.value;
  let myEnvironment = req.swagger.params.environment.value;
  let JobId = guid();
  return runJob(JobId, myEnvironment, serviceEnvironmentPairs) // create the job
    // .then(saveJob) // save it to the database
    .then(job => res
      .location(`api/v1/environment/${myEnvironment}/sync-services/job/${job.jobid}`)
      .json(job));  // redirect to job url
}

module.exports = {
  getSyncEnvironmentServicesJob,
  getSyncEnvironmentServicesJobs,
  postSyncEnvironmentServicesSe
};
