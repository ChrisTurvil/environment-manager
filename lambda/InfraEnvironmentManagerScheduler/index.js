/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let process = require('process');
let schedulerFactory = require('./scheduler.js');

exports.handler = (event, context, callback) => {
  const AWS_REGION = process.env.AWS_REGION;
  const EM_HOST = process.env.EM_HOST;
  const EM_USERNAME = process.env.EM_USERNAME;
  const EM_PASSWORD = process.env.EM_PASSWORD;
  const IGNORE_ASG_INSTANCES = process.env.IGNORE_ASG_INSTANCES || false;
  const LIMIT_TO_ENVIRONMENT = process.env.LIMIT_TO_ENVIRONMENT;
  const LIST_SKIPPED_INSTANCES = process.env.LIST_SKIPPED_INSTANCES || false;
  const WHAT_IF = process.env.WHAT_IF || false;

  let invocationRegion = context.invokedFunctionArn.split(':')[3];
  let account = context.invokedFunctionArn.split(':')[4];

  let config = {
    aws: {
      region: AWS_REGION || invocationRegion
    },
    em: {
      credentials: {
        password: EM_PASSWORD,
        username: EM_USERNAME
      },
      host: EM_HOST
    },
    ignoreASGInstances: IGNORE_ASG_INSTANCES,
    limitToEnvironment: LIMIT_TO_ENVIRONMENT,
    listSkippedInstances: LIST_SKIPPED_INSTANCES,
    whatIf: WHAT_IF
  }

  let scheduler = schedulerFactory.create(account, config);

  try {

    scheduler.doScheduling()
      .then(result => {
        if (result.success) callback(null, logSuccess(result));
        else callback(logError('Scheduling Failure', result));
      })
      .catch(err => {
        callback(logError('Unhandled Exception', err));
      });

  } catch (err) {
    callback(logError('Unhandled Exception', err));
  }

};

function logSuccess(result) {
  console.log(JSON.stringify(result, null, 2));
  return `SUCCESS! See logs for more details.`;
}

function logError(err, details) {
  console.error(JSON.stringify({ err, details }, null, 2));
  return `ERROR: ${err}. See logs for more details.`;
}