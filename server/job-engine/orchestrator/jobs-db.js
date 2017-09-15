'use strict';

let AWS = require('aws-sdk');
let { terminalStates } = require('../task');
let now = require('../now');

let DocumentClient = new AWS.DynamoDB.DocumentClient();

function ifConditionalCheckFailed(value) {
  return (error) => {
    let { code } = error;
    return (code === 'ConditionalCheckFailedException'
      ? Promise.resolve(value)
      : Promise.reject(error));
  };
}

function create({ TableName }) {
  function getJob(JobId) {
    let params = { TableName, Key: { JobId } };
    return DocumentClient.get(params)
      .promise();
  }

  function scanActive() {
    let params = {
      TableName,
      IndexName: 'Status-index',
      KeyConditionExpression: '#Status = :Status',
      ExpressionAttributeNames: {
        '#Status': 'Status'
      },
      ExpressionAttributeValues: {
        ':Status': 'active'
      }
    };
    return DocumentClient.query(params)
      .promise();
  }

  function insertJob(job) {
    let params = {
      Item: job,
      ConditionExpression: 'attribute_not_exists(JobId)'
    };
    return DocumentClient.put(params)
      .promise()
      .then(true)
      .catch(ifConditionalCheckFailed(false));
  }

  function updateTask(JobId, TaskId, { Seq = 0, Status, Result }) {
    return Promise.resolve()
      .then(() => ({
        Key: { JobId },
        UpdateExpression: [
          'SET Tasks.#TaskId.#LastModified = :LastModified, Tasks.#TaskId.#Seq = :Seq, Tasks.#TaskId.#Status = :Status',
          Result !== undefined ? 'Tasks.#TaskId.#Result = :Result' : undefined
        ].filter(s => s !== undefined).join(', '),
        ConditionExpression: '#Status not in :terminalStates and Tasks.#TaskId.#Seq < :Seq',
        ExpressionAttributeNames: Object.assign(
          {
            '#LastModified': 'LastModified',
            '#Seq': 'Seq',
            '#Status': 'Status',
            '#TaskId': TaskId
          },
          Result ? { '#Result': 'Result' } : {}
        ),
        ExpressionAttributeValues: Object.assign(
          {
            ':LastModified': now(),
            ':Seq': Seq,
            ':Status': Status,
            ':terminalStates': terminalStates
          },
          Result ? { '#Result': Result } : {}
        )
      }))
      .then(params => DocumentClient.update(params))
      .promise()
      .then(true)
      .catch(ifConditionalCheckFailed(false));
  }

  function updateJob(JobId, { Status }) {
    return Promise.resolve()
      .then(() => ({
        Key: { JobId },
        UpdateExpression: 'SET #Status = :Status',
        ConditionExpression: '#Status not in :terminalStates',
        ExpressionAttributeNames: { '#Status': 'Status' },
        ExpressionAttributeValues: {
          ':Status': Status,
          ':terminalStates': terminalStates
        }
      }))
      .then(params => DocumentClient.update(params))
      .promise()
      .then(true)
      .catch(ifConditionalCheckFailed(false));
  }

  return {
    getJob,
    insertJob,
    scanActive,
    updateJob,
    updateTask
  };
}
module.exports = create;
