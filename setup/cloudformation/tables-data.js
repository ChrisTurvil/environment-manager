'use strict';

module.exports = () => ({
    ConfigEnvironments: {
        keys: { EnvironmentName: 'S' },
        'x-audit': true
    },
    ConfigServices: {
        keys: { ServiceName: 'S' },
        'x-audit': true
    },
    ConfigDeploymentMaps: {
        keys: { DeploymentMapName: 'S' },
        'x-audit': true
    },
    ConfigNotificationSettings: {
        keys: { NotificationSettingsId: 'S' },
        'x-audit': true
    },
    ConfigEnvironmentTypes: {
        keys: { EnvironmentType: 'S' },
        'x-audit': true
    },
    InfraAsgIPs: { keys: { AsgName: 'S' } },
    InfraChangeAudit: {
        keys: { AuditID: 'S' },
        indices: [
            { keys: { Date: 'S', ISOTimestamp: 'S' } }
        ]
    },
    InfraConfigAccounts: {
        keys: { AccountNumber: 'S' },
        'x-audit': true
    },
    InfraConfigClusters: {
        keys: { ClusterName: 'S' },
        'x-audit': true
    },
    InfraConfigPermissions: {
        keys: { Name: 'S' },
        'x-audit': true
    },
    InfraEnvManagerSessions: { keys: { UserName: 'S' } },
    InfraOpsEnvironment: { keys: { EnvironmentName: 'S' } },
    InfraConfigLBSettings: {
        keys: { EnvironmentName: 'S', VHostName: 'S' },
        indices: [
            { keys: { LoadBalancerGroup: 'S' } }
        ],
        'x-audit': true
    },
    InfraConfigLBUpstream: {
        name: 'InfraConfigLBUpstream',
        keys: { Key: 'S' },
        indices: [
            { keys: { AccountId: 'S' } },
            { keys: { Environment: 'S', Key: 'S' } },
            { keys: { LoadBalancerGroup: 'S' } }
        ],
        'x-audit': true
    }
});
