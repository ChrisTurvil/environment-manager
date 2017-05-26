'use strict';

let R = require('ramda');
let { ref, sub } = require('./template');

function dynamoAlarm(tableResource, rw, threshold, index) {
    let fraction = 0.8;
    return {
        Type: "AWS::CloudWatch::Alarm",
        Properties: {
            ActionsEnabled: true,
            AlarmActions: [ref("pAlertSNSTopic")],
            AlarmDescription: sub(`${rw} throughput exceeded ${fraction.toFixed(2) * 100}% of capacity on \${${tableResource}}${index ? ` index ${index}` : ''}`),
            AlarmName: sub(`\${${tableResource}}${index ? `-${index}` : ''}-${rw}Capacity`),
            ComparisonOperator: "GreaterThanThreshold",
            Dimensions: [
                { Name: "TableName", Value: ref(tableResource) },
                ...(index ? [{ Name: 'GlobalSecondaryIndexName', Value: index }] : [])
            ],
            EvaluationPeriods: 1,
            MetricName: `Consumed${rw}CapacityUnits`,
            Namespace: "AWS/DynamoDB",
            Period: 60,
            Statistic: "Sum",
            Threshold: fraction * threshold
        }
    };
}

function dynamoTableAlarms(tableResourceName, tableDefinition) {

    function resourceName(rw, index) {
        return `${tableResourceName}${index ? `-${index}` : ''}-${rw}CapacityAlarm`;
    }

    let {
        Properties: {
            ProvisionedThroughput: { ReadCapacityUnits, WriteCapacityUnits },
        GlobalSecondaryIndexes: indices = []
        }
    } = tableDefinition;

    return R.fromPairs([
        [resourceName('Read'), dynamoAlarm(tableResourceName, 'Read', ReadCapacityUnits)],
        [resourceName('Write'), dynamoAlarm(tableResourceName, 'Write', WriteCapacityUnits)],
        ...R.chain(
            ({ IndexName, ProvisionedThroughput: { ReadCapacityUnits, WriteCapacityUnits } }) => {
                return [
                    [resourceName('Read', IndexName), dynamoAlarm(tableResourceName, 'Read', ReadCapacityUnits, IndexName)],
                    [resourceName('Write', IndexName), dynamoAlarm(tableResourceName, 'Write', WriteCapacityUnits, IndexName)]
                ];
            })(indices)
    ]);
}

function lambdaFunctionAlarm(lambdaResourceName) {
    return {
        Type: "AWS::CloudWatch::Alarm",
        Properties: {
            ActionsEnabled: true,
            AlarmActions: [ref("pAlertSNSTopic")],
            AlarmDescription: sub(`Error count exceeded threshold for Lambda Function \${${lambdaResourceName}}`),
            AlarmName: sub(`\${${lambdaResourceName}}-ErrorCount`),
            ComparisonOperator: "GreaterThanThreshold",
            EvaluationPeriods: 1,
            MetricName: "Errors",
            Namespace: "AWS/Lambda",
            Dimensions: [
                { Name: "FunctionName", Value: ref(lambdaResourceName) }
            ],
            Period: 60,
            Statistic: "Sum",
            Threshold: 0
        }
    };
}

function lambdaFunctionAlarms(lambdaResourceName) {
    return R.fromPairs([[`${lambdaResourceName}-ErrorCountAlarm`, lambdaFunctionAlarm(lambdaResourceName)]])
}

function alarms(resourceName, resourceDefinition) {
    let { Type } = resourceDefinition;
    switch (Type) {
        case 'AWS::DynamoDB::Table':
            return dynamoTableAlarms(resourceName, resourceDefinition);
        case 'AWS::Lambda::Function':
            return lambdaFunctionAlarms(resourceName, resourceDefinition);
        default:
            return [];
    }
}

module.exports = {
    alarms,
    dynamoAlarm,
    lambdaFunctionAlarm
}