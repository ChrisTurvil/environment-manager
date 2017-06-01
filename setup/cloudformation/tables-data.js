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
    ConfigDeploymentExecutionStatus: {
        keys: { DeploymentID: 'S' }
    },
    ConfigCompletedDeployments: {
        keys: { DeploymentID: 'S' },
        indices: [
            { keys: { StartDate: 'S', StartTimestamp: 'S' } }
        ]
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
