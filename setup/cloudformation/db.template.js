'use strict';

let R = require('ramda');
let {
    dependsOnSeq,
    getAtt,
    ref,
    sub
} = require('./template');
let { alarms } = require('./cloudwatch');
let { streamArn, table } = require('./dynamodb');

let alarmsFrom = R.pipe(
    R.toPairs,
    R.chain(([k, v]) => R.toPairs(alarms(k, v))),
    R.fromPairs
);

let tableDefsFrom = R.pipe(
    R.toPairs,
    R.map(([tableName, def]) => [tableName, table(Object.assign({ tableName }, def))]),
    R.fromPairs
);

let tableOutputsFrom = R.mapObjIndexed((_, tableName) => ({
    Export: { Name: sub(`\${AWS::StackName}:${tableName}`) },
    Value: ref(tableName)
}));

let tableStreamOutputsFrom = R.pipe(
    R.toPairs,
    R.map(([tableName]) => {
        let output = `${tableName}Stream`
        return [output, {
            Export: { Name: sub(`\${AWS::StackName}:${output}`) },
            Value: streamArn(tableName)
        }]
    }),
    R.fromPairs
)


R.mapObjIndexed((_, tableName) => ({
    Export: { Name: sub(`\${AWS::StackName}:${tableName}Stream`) },
    Value: streamArn(tableName)
}));

module.exports = function (tables) {
    let resources = Object.assign(
        {
            lambdaInfraAsgScale: {
                Type: "AWS::Lambda::Function",
                Properties: {
                    Code: "./lambda/InfraAsgLambdaScale/infraAsgLambdaScale.zip",
                    Description: "This function scales auto scaling groups.",
                    FunctionName: "InfraAsgScale",
                    Handler: "index.handler",
                    MemorySize: 128,
                    Role: getAtt('Arn', 'roleInfraAsgScale'),
                    Runtime: "nodejs6.10",
                    Timeout: 30
                }
            },
            snsInfraAsgScale: {
                Type: "AWS::SNS::Topic",
                DependsOn: [
                    "lambdaInfraAsgScale"
                ],
                Properties: {
                    Subscription: [
                        {
                            Endpoint: getAtt('Arn', 'lambdaInfraAsgScale'),
                            Protocol: "lambda"
                        }
                    ],
                    TopicName: "InfraAsgLambdaScale"
                }
            },
            lambdaPermissionInfraAsgScale: {
                Type: "AWS::Lambda::Permission",
                Properties: {
                    Action: "lambda:InvokeFunction",
                    Principal: "sns.amazonaws.com",
                    SourceArn: ref("snsInfraAsgScale"),
                    FunctionName: getAtt('Arn', 'lambdaInfraAsgScale')
                }
            },
            "roleInfraAsgScale": {
                "Type": "AWS::IAM::Role",
                "Properties": {
                    "AssumeRolePolicyDocument": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "lambda.amazonaws.com"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    },
                    "ManagedPolicyArns": [
                        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
                    ],
                    "Policies": [
                        {
                            "PolicyName": "roleInfraAsgScalePolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "ec2:Describe*",
                                            "ec2:DeleteVolume",
                                            "ec2:RunInstances",
                                            "ec2:StartInstances",
                                            "ec2:StopInstances",
                                            "ec2:TerminateInstances",
                                            "ec2:UnmonitorInstances"
                                        ],
                                        "Resource": [
                                            "*"
                                        ]
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": "elasticloadbalancing:Describe*",
                                        "Resource": "*"
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "cloudwatch:ListMetrics",
                                            "cloudwatch:GetMetricStatistics",
                                            "cloudwatch:Describe*"
                                        ],
                                        "Resource": "*"
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "autoscaling:Describe*",
                                            "autoscaling:PutLifecycleHook",
                                            "autoscaling:ResumeProcesses",
                                            "autoscaling:SuspendProcesses",
                                            "autoscaling:CreateOrUpdateScalingTrigger",
                                            "autoscaling:CreateOrUpdateTags",
                                            "autoscaling:DeleteAutoScalingGroup",
                                            "autoscaling:PutScalingPolicy",
                                            "autoscaling:PutScheduledUpdateGroupAction",
                                            "autoscaling:PutNotificationConfiguration",
                                            "autoscaling:SetDesiredCapacity",
                                            "autoscaling:SuspendProcesses",
                                            "autoscaling:TerminateInstanceInAutoScalingGroup",
                                            "autoscaling:UpdateAutoScalingGroup"
                                        ],
                                        "Resource": [
                                            "*"
                                        ]
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "sns:ConfirmSubscription",
                                            "sns:ListTopics",
                                            "sns:Publish",
                                            "sns:Subscribe",
                                            "sns:Unsubscribe"
                                        ],
                                        "Resource": [
                                            sub("arn:aws:sns:eu-west-1:${AWS::AccountId}:tl-governator-stop"),
                                            sub("arn:aws:sns:eu-west-1:${AWS::AccountId}:asgLambdaScale"),
                                            sub("arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraGovernator"),
                                            sub("arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraAsgLambdaScale")
                                        ]
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "dynamodb:*"
                                        ],
                                        "Resource": [
                                            sub("arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/ConfigAsgIPs"),
                                            sub("arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/InfraAsgIPs")
                                        ]
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "iam:PassRole"
                                        ],
                                        "Resource": [
                                            sub("arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale")
                                        ]
                                    },
                                    {
                                        "Action": "sts:AssumeRole",
                                        "Effect": "Allow",
                                        "Resource": [
                                            sub("arn:aws:iam::${pMasterAccountId}:role/roleInfraAsgScale"),
                                            sub("arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale")
                                        ]
                                    }
                                ]
                            }
                        }
                    ],
                    "RoleName": "roleInfraAsgScale"
                }
            }
        },
        dependsOnSeq(tableDefsFrom(tables))
    );

    return {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Environment Manager Core Database Resources",
        Parameters: {
            pAlertSNSTopic: {
                Type: "String",
                Description: "SNS Topic ARN for lambda alerts."
            }
        },
        Resources: Object.assign(
            resources,
            alarmsFrom(resources)
        ),
        Outputs: Object.assign(
            tableOutputsFrom(tables),
            tableStreamOutputsFrom(tables)
        )
    }
}

if (require.main === module) {
    process.stdout.write(JSON.stringify(module.exports()));
}
