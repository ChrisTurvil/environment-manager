'use strict';

let R = require('ramda');
const test = require('tape');
const { dynamoAlarm,lambdaFunctionAlarm, alarms } = require('./cloudwatch');

test('cloudwatch dynamoAlarm: returns an alarm definition for a table', (t) => {
    let expected = {
        Type: "AWS::CloudWatch::Alarm",
        Properties: {
            ActionsEnabled: true,
            AlarmActions: [{ "Ref": "pAlertSNSTopic" }],
            AlarmDescription: { 'Fn::Sub': 'Read throughput exceeded 80% of capacity on ${MyTable}' },
            AlarmName: { 'Fn::Sub': '${MyTable}-ReadCapacity' },
            ComparisonOperator: "GreaterThanThreshold",
            Dimensions: [
                { Name: "TableName", Value: { Ref: 'MyTable' } }
            ],
            EvaluationPeriods: 1,
            MetricName: `ConsumedReadCapacityUnits`,
            Namespace: "AWS/DynamoDB",
            Period: 60,
            Statistic: "Sum",
            Threshold: 8
        }
    };
    let result = dynamoAlarm('MyTable', 'Read', 10);
    t.deepEqual(result, expected);
    t.end();
});

test('cloudwatch dynamoAlarm: returns an alarm definition for a secondary index', (t) => {
    let expected = {
        Type: "AWS::CloudWatch::Alarm",
        Properties: {
            ActionsEnabled: true,
            AlarmActions: [{ "Ref": "pAlertSNSTopic" }],
            AlarmDescription: { 'Fn::Sub': 'Write throughput exceeded 80% of capacity on ${MyTable} index Name-Age-index' },
            AlarmName: { 'Fn::Sub': '${MyTable}-Name-Age-index-WriteCapacity' },
            ComparisonOperator: "GreaterThanThreshold",
            Dimensions: [
                { Name: "TableName", Value: { Ref: 'MyTable' } },
                { Name: 'GlobalSecondaryIndexName', Value: 'Name-Age-index' }
            ],
            EvaluationPeriods: 1,
            MetricName: `ConsumedWriteCapacityUnits`,
            Namespace: "AWS/DynamoDB",
            Period: 60,
            Statistic: "Sum",
            Threshold: 8
        }
    };
    let result = dynamoAlarm('MyTable', 'Write', 10, 'Name-Age-index');
    t.deepEqual(result, expected);
    t.end();
});

test('cloudwatch lambdaFunctionAlarm: returns an alarm definition for a lambda function', (t) => {
    let expected = {
        Type: "AWS::CloudWatch::Alarm",
        Properties: {
            ActionsEnabled: true,
            AlarmActions: [{ "Ref": "pAlertSNSTopic" }],
            AlarmDescription: { 'Fn::Sub': 'Error count exceeded threshold for Lambda Function ${MyFunction}' },
            AlarmName: { 'Fn::Sub': '${MyFunction}-ErrorCount' },
            ComparisonOperator: "GreaterThanThreshold",
            Dimensions: [
                { Name: "FunctionName", Value: { Ref: 'MyFunction' } }
            ],
            EvaluationPeriods: 1,
            MetricName: `Errors`,
            Namespace: "AWS/Lambda",
            Period: 60,
            Statistic: "Sum",
            Threshold: 0
        }
    };
    let result = lambdaFunctionAlarm('MyFunction');
    t.deepEqual(result, expected);
    t.end();
});

test('cloudwatch alarms: returns expected alarms for a DynamoDB table', (t) => {
    let expected = {
        'MyTable-ReadCapacityAlarm': dynamoAlarm('MyTable', 'Read', 10),
        'MyTable-WriteCapacityAlarm': dynamoAlarm('MyTable', 'Write', 5),
    }
    let result = alarms('MyTable', {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 5
            }
        }
    });
    t.deepEqual(result, expected)
    t.end();
});

test('cloudwatch alarms: returns expected alarms for a DynamoDB table index', (t) => {
    let spec = {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 5
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'Name-Age-index',
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 20,
                        WriteCapacityUnits: 15
                    }
                }
            ]
        }
    };
    let expected = {
        'MyTable-Name-Age-index-ReadCapacityAlarm': dynamoAlarm('MyTable', 'Read', 20, 'Name-Age-index'),
        'MyTable-Name-Age-index-WriteCapacityAlarm': dynamoAlarm('MyTable', 'Write', 15, 'Name-Age-index')
    };
    let result = alarms('MyTable', spec);
    t.deepEqual(Object.keys(result), [
        'MyTable-ReadCapacityAlarm',
        'MyTable-WriteCapacityAlarm',
        'MyTable-Name-Age-index-ReadCapacityAlarm',
        'MyTable-Name-Age-index-WriteCapacityAlarm'
    ]);
    t.deepEqual(R.omit(['MyTable-ReadCapacityAlarm', 'MyTable-WriteCapacityAlarm'], result), expected)
    t.end();
});

test('cloudwatch alarms: returns expected alarms for a Lambda Function', (t) => {
    let expected = {
        'MyFunction-ErrorCountAlarm': lambdaFunctionAlarm('MyFunction'),
    }
    let result = alarms('MyFunction', {
        Type: 'AWS::Lambda::Function',
    });
    t.deepEqual(result, expected)
    t.end();
});