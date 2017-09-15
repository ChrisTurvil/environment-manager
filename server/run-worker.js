'use strict';

let AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });
let worker = require('./job-engine/worker');
worker.start('https://sqs.eu-west-1.amazonaws.com/886983751479/merlin-test');