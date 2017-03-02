/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS = require('aws-sdk');

/* See example of string matched by DYNAMO_STREAM_ARN_REGEX below:
/* arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899
*/
const DYNAMO_STREAM_ARN_REGEX = /^arn:aws:dynamodb:([^:]+):([^:]+):table\/([^\/]+)/;

/* See example of string matched by LAMBDA_FUNCTION_ARN_REGEX below:
/* arn:aws:lambda:eu-west-1:886983751479:function:InfraEnvironmentManagerArchiveCompletedDeployments
*/
const LAMBDA_FUNCTION_ARN_REGEX = /^arn:aws:lambda:([^:]+):([^:]+):function:([^:\/]+)/;

function at(array) {
  function loop(obj, rest) {
    if (rest.length === 0) {
      return obj;
    }
    if (obj === undefined || obj === null) {
      return undefined;
    }
    let first = rest.shift();
    return loop(obj[first], rest);
  }
  return obj => loop(obj, array.slice());
}

function dateStr(s) {
  try {
    return new Date(s).toISOString();
  } catch (e) {
    return new Date(0).toISOString();
  }
}

function parseDynamoStreamARN(eventSourceARN) {
  let result = DYNAMO_STREAM_ARN_REGEX.exec(eventSourceARN);
  if (result === null) {
    throw new Error(`The eventSourceARN did not match the expected format for a DynamoDB table: ${eventSourceARN}`);
  }
  return {
    region: result[1],
    accountId: result[2],
    tableName: result[3],
  };
}

function parseLambdaARN(arn) {
  let result = LAMBDA_FUNCTION_ARN_REGEX.exec(arn);
  if (result === null) {
    throw new Error(`The ARN did not match the expected format for a Lambda function: ${arn}`);
  }
  return {
    region: result[1],
    accountId: result[2],
    functionName: result[3],
  };
}

function transform(record) {
  let item = at(['dynamodb', 'NewImage'])(record);
  let startTimestamp = dateStr(at(['Value', 'M', 'StartTimestamp', 'S'])(item));

  item.StartDate = { S: startTimestamp.substring(0, 10) };
  item.StartTimestamp = { S: startTimestamp };
  return item;
}

exports.handler = function (event, context, callback) {
  const DESTINATION_TABLE_NAME = process.env.DESTINATION_TABLE_NAME;

  function write(record) {
    let dynamo = new AWS.DynamoDB();
    let params = {
      Item: record,
      TableName: DESTINATION_TABLE_NAME,
    };
    return dynamo.putItem(params).promise();
  }

  let succeed = x => callback(null, x);
  let fail = x => callback(x);
  let self = parseLambdaARN(context.invokedFunctionArn);

  function remove(record) {
    let source = parseDynamoStreamARN(record.eventSourceARN);
    if (source.accountId !== self.accountId) {
      console.warn(`Cannot remove a record from a table owned by another account: ${record.eventSourceARN}`);
      console.warn(record.dynamodb.Keys);
      return Promise.resolve();
    }
    let dynamo = new AWS.DynamoDB({ region: record.awsRegion });
    let params = {
      Key: record.dynamodb.Keys,
      TableName: source.tableName,
    };
    return dynamo.deleteItem(params).promise();
  }

  let completed = event.Records.filter(x => {
    let status = at(['dynamodb', 'NewImage', 'Value', 'M', 'Status', 'S'])(x);
    return ['Cancelled', 'Failed', 'Success'].some(x => x === status);
  });

  let writes = Promise.all(completed.map(x => write(transform(x)).then(() => remove(x))));
  return writes.then(succeed, fail);
};