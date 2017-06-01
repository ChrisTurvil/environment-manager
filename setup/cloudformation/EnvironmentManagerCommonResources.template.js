'use strict';

let {
    dependsOnSeq,
    streamArn,
    triggerAll: trigger
} = require('./template');

module.exports = function () {
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Environment Manager Resources",
        "Parameters": {
            "pResourcePrefix": {
                "Type": "String",
                "Description": "Prefix for named AWS resources",
                "Default": ""
            },
            "pMasterAccountId": {
                "Type": "String",
                "Description": "Master AWS account ID",
                "AllowedPattern": "[0-9]{12}"
            },
            "pAlertSNSTopic": {
                "Type": "String",
                "Description": "SNS Topic ARN for lambda alerts."
            }
        },
        "Resources": Object.assign(dependsOnSeq({
            "ConfigEnvironments": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}ConfigEnvironments" }
                }
            },
            "AlertReadCapacityConfigEnvironments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "AlertReadCapacityConfigEnvironments",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityConfigEnvironments" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigEnvironments" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigEnvironments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "AlertWriteCapacityConfigEnvironments",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityConfigEnvironments" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigEnvironments" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigServices": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "ServiceName",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "OwningCluster",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "ServiceName",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "OwningCluster",
                            "KeyType": "RANGE"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}ConfigServices" }
                }
            },
            "AlertReadCapacityConfigServices": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigServices",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityConfigServices" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigServices" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigServices": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigServices",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityConfigServices" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigServices" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigDeploymentMaps": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "DeploymentMapName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "DeploymentMapName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}ConfigDeploymentMaps" }
                }
            },
            "AlertReadCapacityConfigDeploymentMaps": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigDeploymentMaps",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityConfigDeploymentMaps" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigDeploymentMaps" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigDeploymentMaps": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigDeploymentMaps",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityConfigDeploymentMaps" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigDeploymentMaps" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigLBSettings": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "LoadBalancerGroup",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "VHostName",
                            "AttributeType": "S"
                        }
                    ],
                    "GlobalSecondaryIndexes": [
                        {
                            "IndexName": "LoadBalancerGroup-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "LoadBalancerGroup",
                                    "KeyType": "HASH"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 2
                            }
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "VHostName",
                            "KeyType": "RANGE"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraConfigLBSettings" }
                }
            },
            "AlertReadCapacityInfraConfigLBSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigLBSettings",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraConfigLBSettings" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigLBSettings" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigLBSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigLBSettings",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraConfigLBSettings" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigLBSettings" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigLBUpstream": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AccountId",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Environment",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Key",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "LoadBalancerGroup",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Service",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Upstream",
                            "AttributeType": "S"
                        }
                    ],
                    "GlobalSecondaryIndexes": [
                        {
                            "IndexName": "AccountId-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "AccountId",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "Key",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 2
                            }
                        },
                        {
                            "IndexName": "Environment-Key-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "Environment",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "Key",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 2
                            }
                        },
                        {
                            "IndexName": "LoadBalancerGroup-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "LoadBalancerGroup",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "Key",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 2
                            }
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "Key",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraConfigLBUpstream" }
                }
            },
            "AlertReadCapacityInfraConfigLBUpstream": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigLBUpstream",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraConfigLBUpstream" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigLBUpstream" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigLBUpstream": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigLBUpstream",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraConfigLBUpstream" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigLBUpstream" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigNotificationSettings": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "NotificationSettingsId",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "NotificationSettingsId",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}ConfigNotificationSettings" }
                }
            },
            "AlertReadCapacityConfigNotificationSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigNotificationSettings",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityConfigNotificationSettings" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigNotificationSettings" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigNotificationSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigNotificationSettings",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityConfigNotificationSettings" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigNotificationSettings" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigEnvironmentTypes": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentType",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentType",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}ConfigEnvironmentTypes" }
                }
            },
            "AlertReadCapacityConfigEnvironmentTypes": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigEnvironmentTypes",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityConfigEnvironmentTypes" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigEnvironmentTypes" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigEnvironmentTypes": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigEnvironmentTypes",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityConfigEnvironmentTypes" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "ConfigEnvironmentTypes" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraAsgIPs": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AsgName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AsgName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraAsgIPs" }
                }
            },
            "AlertReadCapacityInfraAsgIPs": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraAsgIPs",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraAsgIPs" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraAsgIPs" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraAsgIPs": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraAsgIPs",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraAsgIPs" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraAsgIPs" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraChangeAudit": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AuditID",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Date",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "ISOTimestamp",
                            "AttributeType": "S"
                        }
                    ],
                    "GlobalSecondaryIndexes": [
                        {
                            "IndexName": "Date-ISOTimestamp-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "Date",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "ISOTimestamp",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 5
                            }
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AuditID",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 20,
                        "WriteCapacityUnits": 5
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraChangeAudit" }
                }
            },
            "AlertReadCapacityInfraChangeAudit": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraChangeAudit",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraChangeAudit" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraChangeAudit" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraChangeAudit": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraChangeAudit",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraChangeAudit" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraChangeAudit" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigAccounts": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AccountNumber",
                            "AttributeType": "N"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AccountNumber",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraConfigAccounts" }
                }
            },
            "AlertReadCapacityInfraConfigAccounts": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigAccounts",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraConfigAccounts" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigAccounts" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigAccounts": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigAccounts",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraConfigAccounts" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigAccounts" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigClusters": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "ClusterName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "ClusterName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraConfigClusters" }
                }
            },
            "AlertReadCapacityInfraConfigClusters": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigClusters",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraConfigClusters" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigClusters" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigClusters": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigClusters",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraConfigClusters" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigClusters" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigPermissions": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "Name",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "Name",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraConfigPermissions" }
                }
            },
            "AlertReadCapacityInfraConfigPermissions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigPermissions",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraConfigPermissions" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigPermissions" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigPermissions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigPermissions",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraConfigPermissions" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraConfigPermissions" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraEnvManagerSessions": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "UserName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "UserName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraEnvManagerSessions" }
                }
            },
            "AlertReadCapacityInfraEnvManagerSessions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraEnvManagerSessions",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraEnvManagerSessions" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraEnvManagerSessions" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraEnvManagerSessions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraEnvManagerSessions",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraEnvManagerSessions" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraEnvManagerSessions" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraOpsEnvironment": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": { "Fn::Sub": "${pResourcePrefix}InfraOpsEnvironment" }
                }
            },
            "AlertReadCapacityInfraOpsEnvironment": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraOpsEnvironment",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertReadCapacityInfraOpsEnvironment" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraOpsEnvironment" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraOpsEnvironment": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraOpsEnvironment",
                    "AlarmName": { "Fn::Sub": "${pResourcePrefix}AlertWriteCapacityInfraOpsEnvironment" },
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": { "Ref": "InfraOpsEnvironment" } }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            }
        }), {
                "lambdaInfraEnvironmentManagerAudit": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Code": "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip",
                        "Description": "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log.",
                        "FunctionName": { "Fn::Sub": "${pResourcePrefix}InfraEnvironmentManagerAudit" },
                        "Handler": "index.handler",
                        "MemorySize": 128,
                        "Role": {
                            "Fn::GetAtt": [
                                "roleInfraEnvironmentManagerAudit",
                                "Arn"
                            ]
                        },
                        "Runtime": "nodejs4.3",
                        "Timeout": 3
                    }
                },
                "alertInfraEnvironmentManagerAudit": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "ActionsEnabled": true,
                        "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                        "AlarmDescription": "If there is an error in this lambda, report to SNS topic.",
                        "AlarmName": "alertInfraEnvironmentManagerAudit",
                        "ComparisonOperator": "GreaterThanThreshold",
                        "EvaluationPeriods": 1,
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Dimensions": [
                            {
                                "Name": "FunctionName",
                                "Value": { "Ref": "InfraEnvironmentManagerAudit" }
                            }
                        ],
                        "Period": 60,
                        "Statistic": "Sum",
                        "Threshold": 0
                    }
                },
                "roleInfraEnvironmentManagerAudit": {
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
                                "PolicyName": "roleInfraEnvironmentManagerAuditPolicy",
                                "PolicyDocument": {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:BatchWriteItem",
                                                "dynamodb:PutItem"
                                            ],
                                            "Resource": [
                                                {
                                                    "Ref": "InfraChangeAudit"
                                                }
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:GetRecords",
                                                "dynamodb:GetShardIterator",
                                                "dynamodb:DescribeStream",
                                                "dynamodb:ListStreams"
                                            ],
                                            "Resource": [
                                                'InfraConfigLBSettings',
                                                'InfraConfigLBUpstream',
                                                'ConfigServices',
                                                'InfraConfigClusters',
                                                'ConfigEnvironments',
                                                'InfraConfigPermissions',
                                                'ConfigEnvironmentTypes',
                                                'ConfigDeploymentMaps',
                                                'InfraConfigAccounts',
                                                'ConfigNotificationSettings'
                                            ].map(streamArn)
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                "auditTriggerInfraConfigLBSettings": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigLBSettings')),
                "auditTriggerInfraConfigLBUpstream": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigLBUpstream')),
                "auditTriggerConfigServices": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigServices')),
                "auditTriggerInfraConfigClusters": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigClusters')),
                "auditTriggerConfigEnvironments": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigEnvironments')),
                "auditTriggerInfraConfigPermissions": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigPermissions')),
                "auditTriggerConfigEnvironmentTypes": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigEnvironmentTypes')),
                "auditTriggerConfigDeploymentMaps": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigDeploymentMaps')),
                "auditTriggerInfraConfigAccounts": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigAccounts')),
                "auditTriggerConfigNotificationSettings": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigNotificationSettings')),
                "lambdaInfraAsgScale": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Code": "./lambda/InfraAsgLambdaScale/infraAsgLambdaScale.zip",
                        "Description": "This function scales auto scaling groups.",
                        "FunctionName": { "Fn::Sub": "${pResourcePrefix}InfraAsgScale" },
                        "Handler": "index.handler",
                        "MemorySize": 128,
                        "Role": {
                            "Fn::GetAtt": [
                                "roleInfraAsgScale",
                                "Arn"
                            ]
                        },
                        "Runtime": "nodejs4.3",
                        "Timeout": 30
                    }
                },
                "alertInfraAsgScale": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "ActionsEnabled": true,
                        "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                        "AlarmDescription": "If there is an error in this lambda, report to SNS topic.",
                        "AlarmName": "alertInfraAsgScale",
                        "ComparisonOperator": "GreaterThanThreshold",
                        "EvaluationPeriods": 1,
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Dimensions": [
                            {
                                "Name": "FunctionName",
                                "Value": { "Ref": "InfraAsgScale" }
                            }
                        ],
                        "Period": 60,
                        "Statistic": "Sum",
                        "Threshold": 0
                    }
                },
                "snsInfraAsgScale": {
                    "Type": "AWS::SNS::Topic",
                    "DependsOn": [
                        "lambdaInfraAsgScale"
                    ],
                    "Properties": {
                        "Subscription": [
                            {
                                "Endpoint": {
                                    "Fn::GetAtt": [
                                        "lambdaInfraAsgScale",
                                        "Arn"
                                    ]
                                },
                                "Protocol": "lambda"
                            }
                        ],
                        "TopicName": "InfraAsgLambdaScale"
                    }
                },
                "lambdaPermissionInfraAsgScale": {
                    "Type": "AWS::Lambda::Permission",
                    "Properties": {
                        "Action": "lambda:InvokeFunction",
                        "Principal": "sns.amazonaws.com",
                        "SourceArn": {
                            "Ref": "snsInfraAsgScale"
                        },
                        "FunctionName": {
                            "Fn::GetAtt": [
                                "lambdaInfraAsgScale",
                                "Arn"
                            ]
                        }
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
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:tl-governator-stop"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:asgLambdaScale"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraGovernator"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraAsgLambdaScale"
                                                }
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:*"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/ConfigAsgIPs"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/InfraAsgIPs"
                                                }
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "iam:PassRole"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale"
                                                }
                                            ]
                                        },
                                        {
                                            "Action": "sts:AssumeRole",
                                            "Effect": "Allow",
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${pMasterAccountId}:role/roleInfraAsgScale"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ],
                        "RoleName": "roleInfraAsgScale"
                    }
                }
            }),
        "Outputs": {}
    }
}
