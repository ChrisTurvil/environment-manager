'use strict';

let tables = require('./tables-data')();
let {
    dependsOnSeq,
    getAtt,
    ref,
    sub
} = require('./template');
let { streamArn, table } = require('./dynamodb');
let { trigger } = require('./lambda');

let toPairs = obj => Object.keys(obj).map(key => [key, obj[key]]);
let fromPairs = array => array.reduce((acc, [k, v]) => {
    if (Object.hasOwnProperty.call(acc, k)) {
        throw new Error(`Result property already assigned. ${k}`);
    } else {
        acc[k] = v;
    }
    return acc;
}, {});

let mapO = fn => obj => fromPairs(toPairs(obj).map(([k, v]) => fn(k, v)));

let auditTriggersFrom = mapO((tableName) => [`${tableName}AuditTrigger`, trigger('lambdaInfraEnvironmentManagerAudit', streamArn(tableName))]);
let tableDefsFrom = mapO((tableName, def) => [tableName, table(Object.assign({ tableName }, def))]);
let tableOutputsFrom = mapO((tableName) => [tableName, {
    Export: { Name: sub(`\${AWS::StackName}:${tableName}`) },
    Value: { Ref: tableName }
}]);

module.exports = function () {
    return {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Environment Manager Core Database Resources",
        Parameters: {
            pMasterAccountId: {
                Type: "String",
                Description: "Master AWS account ID",
                AllowedPattern: "[0-9]{12}"
            },
            pAlertSNSTopic: {
                Type: "String",
                Description: "SNS Topic ARN for lambda alerts."
            }
        },
        Resources:
        Object.assign(
            {
                roleInfraEnvironmentManagerAudit: {
                    Type: "AWS::IAM::Role",
                    Properties: {
                        AssumeRolePolicyDocument: {
                            Version: "2012-10-17",
                            Statement: [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "lambda.amazonaws.com"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        },
                        ManagedPolicyArns: [
                            "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
                        ],
                        Policies: [
                            {
                                PolicyName: "roleInfraEnvironmentManagerAuditPolicy",
                                PolicyDocument: {
                                    Version: "2012-10-17",
                                    Statement: [
                                        {
                                            Effect: "Allow",
                                            Action: [
                                                "dynamodb:GetRecords",
                                                "dynamodb:GetShardIterator",
                                                "dynamodb:DescribeStream",
                                                "dynamodb:ListStreams"
                                            ],
                                            Resource: toPairs(tables).filter(([, def]) => def.audit).map(([tableName]) => streamArn(tableName))
                                        },
                                        {
                                            Effect: "Allow",
                                            Action: [
                                                "dynamodb:BatchWriteItem",
                                                "dynamodb:PutItem"
                                            ],
                                            Resource: [
                                                ref('InfraChangeAudit')
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                lambdaInfraEnvironmentManagerAudit: {
                    Type: "AWS::Lambda::Function",
                    Properties: {
                        Code: "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip",
                        Description: "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log.",
                        FunctionName: "InfraEnvironmentManagerAudit",
                        Handler: "index.handler",
                        MemorySize: 128,
                        Role: getAtt('Arn', 'roleInfraEnvironmentManagerAudit'),
                        Runtime: "nodejs6.10",
                        Timeout: 3
                    }
                }
            },
            dependsOnSeq(tableDefsFrom(tables)),
            auditTriggersFrom(tables)
        ),
        Outputs: tableOutputsFrom(tables)
    }
}