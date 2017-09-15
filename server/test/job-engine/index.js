'use strict';

let AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-1' });

let orchestrator = require('job-engine/orchestrator');
let worker = require('job-engine/worker');

let jobsTable = 'merlin-test';
let orchestratorQueueUrl = 'https://sqs.eu-west-1.amazonaws.com/886983751479/merlin-test-reply';
let workerQueueUrl = 'https://sqs.eu-west-1.amazonaws.com/886983751479/merlin-test';

let w = worker.start(workerQueueUrl);
let o = orchestrator.start(jobsTable, orchestratorQueueUrl, workerQueueUrl);

let params = {
  MessageBody: JSON.stringify({
    Type: 'NewJob',
    JobId: '1',
    Status: 'active',
    Tasks: {
      EchoHello1: {
        Args: { Message: 'Hello' },
        Command: 'echo/v1',
        LastModified: Date.now(),
        Seq: 0,
        Status: 'pending',
        TTL: 6000
      },
      EchoWorld1: {
        Args: { Message: 'World !' },
        Command: 'echo/v1',
        DependsOn: ['EchoHello1'],
        LastModified: Date.now(),
        Seq: 0,
        Status: 'pending',
        TTL: 6000
      }
    }
  }),
  QueueUrl: orchestratorQueueUrl
};

let sqs = new AWS.SQS();
sqs.sendMessage(params).promise().then(x => console.log(x)).catch(e => console.log(e));
