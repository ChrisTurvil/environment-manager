'use strict';

const R = require('ramda');
let { trigger } = require('./lambda');
let { follow, getAtt, ref } = require('./template');

let parametersFrom = R.pipe(
    R.map(({ outputName, resourceName }) => [outputName, { 
        Type: 'String',
        Description: `The ARN of the DynamoDB stream of ${resourceName}`
     }]),
    R.fromPairs
);

let auditTriggersFrom = R.pipe(
    R.map(({ outputName, resourceName }) =>
    [`${resourceName}-AuditTrigger`, trigger('lambdaInfraEnvironmentManagerAudit', ref(outputName))]),
    R.fromPairs
);

module.exports = function (template) {
    let resourcesToAudit = R.pipe(
        R.path(['Outputs']),
        R.toPairs,
        R.filter(R.pathEq([1, 'Value', 'Fn::GetAtt', 1], 'StreamArn')),
        R.map(([outputName, { Value }]) => {
            let [resourceName, definition] = follow(Value, template);
            return { outputName, resourceName, definition };
        }),
        R.filter(({ definition: { Type, 'x-audit': audit }}) => Type === 'AWS::DynamoDB::Table' && audit)
    )(template);

    return {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Environment Manager Audit Resources",
        Parameters: Object.assign(
            parametersFrom(resourcesToAudit),
            {
            pAlertSNSTopic: {
                Type: "String",
                Description: "SNS Topic ARN for lambda alerts."
            }
        }),
        Resources: Object.assign(
            auditTriggersFrom(resourcesToAudit),
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
                                            Resource: R.map(({ outputName }) => ref(outputName), resourcesToAudit)
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
            }),
        Outputs: {}
    };
    
};

