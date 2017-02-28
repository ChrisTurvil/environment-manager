/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let process = require('process');
let sut = require('../index');

const environment = {
  AWS_REGION: 'eu-west-1',
  EM_HOST: 'http://localhost:8080/',
  EM_USERNAME: 'my username',
  EM_PASSWORD: 'my password',
  IGNORE_ASG_INSTANCES: 'false',
  LIMIT_TO_ENVIRONMENT: 'xxx',
  LIST_SKIPPED_INSTANCES: 'true',
  WHAT_IF: 'true'
};

function setup() {
  Object.keys(environment)
    .forEach(variable => process.env[variable] = environment[variable]);
}

let event = {};

let context = {
  invokedFunctionArn: 'arn:aws:lambda:eu-west-1:<my-account-number>:function:<my-function-name>'
}

setup();
sut.handler(event, context, (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
});
