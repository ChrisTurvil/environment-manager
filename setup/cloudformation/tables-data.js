'use strict';

module.exports = () => ({
    ConfigEnvironments: {
        keys: { EnvironmentName: 'S' },
        features: { audit: true }
    },
    ConfigServices: {
        keys: { ServiceName: 'S' },
        features: { audit: true }
    },
    ConfigDeploymentMaps: {
        keys: { DeploymentMapName: 'S' },
        features: { audit: true }
    },
    ConfigNotificationSettings: {
        keys: { NotificationSettingsId: 'S' },
        features: { audit: true }
    },
    ConfigEnvironmentTypes: {
        keys: { EnvironmentType: 'S' },
        features: { audit: true }
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
        features: { audit: true }
    },
    InfraConfigClusters: {
        keys: { ClusterName: 'S' },
        features: { audit: true }
    },
    InfraConfigPermissions: {
        keys: { Name: 'S' },
        features: { audit: true }
    },
    InfraEnvManagerSessions: { keys: { UserName: 'S' } },
    InfraOpsEnvironment: { keys: { EnvironmentName: 'S' } },
    InfraConfigLBSettings: {
        keys: { EnvironmentName: 'S', VHostName: 'S' },
        indices: [
            { keys: { LoadBalancerGroup: 'S' } }
        ],
        features: { audit: true }
    },
    InfraConfigLBUpstream: {
        name: 'InfraConfigLBUpstream',
        keys: { Key: 'S' },
        indices: [
            { keys: { AccountId: 'S' } },
            { keys: { Environment: 'S', Key: 'S' } },
            { keys: { LoadBalancerGroup: 'S' } }
        ],
        features: { audit: true }
    }
});
