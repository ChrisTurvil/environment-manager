/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let systemUser = require('modules/systemUser');
let sender = require('modules/sender');
let deployments = require('modules/data-access/deployments');
let DeploymentLogsStreamer = require('modules/DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();
let Enums = require('Enums');
let logger = require('modules/logger');

module.exports = {
  started(deployment) {
    let record = {
      AccountName: deployment.accountName,
      DeploymentID: deployment.id,
      Value: {
        DeploymentType: 'Parallel',
        EnvironmentName: deployment.environmentName,
        EnvironmentType: deployment.environmentTypeName,
        OwningCluster: deployment.clusterName,
        Region: deployment.region || null,
        SchemaVersion: 2,
        ServiceName: deployment.serviceName,
        ServiceSlice: deployment.serviceSlice,
        ServiceVersion: deployment.serviceVersion,
        RuntimeServerRoleName: deployment.serverRole,
        ServerRoleName: deployment.serverRoleName,
        Status: 'In Progress',
        User: deployment.username,
        StartTimestamp: new Date().toISOString(),
        EndTimestamp: null,
        ExecutionLog: []
      }
    };

    return deployments.create(record).then(() => {
      deploymentLogsStreamer.log(deployment.id, 'Deployment started');
    });
  },

  inProgress(deploymentId, message) {
    deploymentLogsStreamer.log(deploymentId, message);
  },

  updateStatus({ deploymentId, environmentName, nodesDeployment }, newStatus) {
    let logError = error => logger.error(error);

    logger.debug(`Updating deployment '${deploymentId}' status to '${newStatus.name}'`);

    /**
     * flush log entries before changing status. A status change may move
     * the record to another table. If this occurs before the log entries
     * are flushed then the log entries may not be written.
     */
    return updateDeploymentTargetState(deploymentId, environmentName, newStatus)
      .catch(logError)
      .then(() => deploymentLogsStreamer.log(deploymentId, newStatus.reason))
      .then(() => deploymentLogsStreamer.flush(deploymentId))
      .catch(logError)
      .then(() => updateDeploymentDynamoTable(deploymentId, nodesDeployment, newStatus))
      .catch(logError);
  }
};

function updateDeploymentDynamoTable(deploymentId, nodesDeployment, newStatus) {
  let { Success, InProgress } = Enums.DEPLOYMENT_STATUS;
  let running = newStatus.name === InProgress;
  let succeeded = newStatus.name === Success;

  let updateExpression = ['update',
    ['set', ['at', 'Value', 'Status'], ['val', newStatus.name]],
    ['set', ['at', 'Value', 'Nodes'], ['val', nodesDeployment || []]]
  ];

  if (!running && !succeeded && newStatus.reason !== undefined) {
    updateExpression.push(['set', ['at', 'Value', 'ErrorReason'], ['val', newStatus.reason]]);
  }
  if (!running) {
    updateExpression.push(['set', ['at', 'Value', 'EndTimestamp'], ['val', new Date().toISOString()]]);
  }

  return deployments.update({ key: { DeploymentID: deploymentId }, updateExpression });
}

function updateDeploymentTargetState(deploymentId, environmentName, newStatus) {
  let command = {
    deploymentId,
    name: 'UpdateTargetState',
    environment: environmentName,
    key: `deployments/${deploymentId}/overall_status`,
    value: newStatus.name
  };

  return sender.sendCommand({ command, user: systemUser });
}
