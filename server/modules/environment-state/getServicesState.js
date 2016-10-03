/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let co = require('co');
let logger = require('modules/logger');
let targetStates = require('modules/service-targets');

/**
 * Generate service health info (with checks list and pass / fail)
 */
function getServiceChecksInfo(serviceObjects) {
  // Get all health checks for all instances of this service
  var serviceChecks = _.flatMap(serviceObjects, 'HealthChecks');
   
  var checksGrouped = _.groupBy(serviceChecks, 'Name');
  return _.map(checksGrouped, function (checks, checkName) {
     
    // If some instances checks failed for a given check, mark as failed
    // also, don't count in instance into working
    if (_.some(checks, { Status: 'critical' })) {
      return {
        Name: checks[0].Name,
        Status: Enums.HEALTH_STATUS.Error,
      };
    } else {
      return {
        Name: checks[0].Name,
        Status: Enums.HEALTH_STATUS.Healthy,
      };
    }
  });
}

function getServiceOverallHealth(healthChecks) {
  if (_.some(healthChecks, { Status: Enums.HEALTH_STATUS.Error })) {
    return {
      Status: Enums.HEALTH_STATUS.Error,
    };
  } else {
    return {
      Status: Enums.HEALTH_STATUS.Healthy
    };
  }
}

function* getServicesTargetState(environmentName, runtimeServerRoleName, instances) {
  let targetServiceStates = yield targetStates.getAllServiceTargets(environmentName, runtimeServerRoleName);
  let allServiceObjects = _.flatMap(instances, instance => instance.Services);

  // Find all objects representing particular service for all nodes
  let servicesGrouped = _.groupBy(allServiceObjects, 'Name');
  let services = _.map(targetServiceStates, (service) => {

    // serviceObjects now has all 'Name' service descriptors in instances
    let serviceObjects = servicesGrouped[service.Name];
    _.each(serviceObjects, (obj) => {
      if (obj.Version !== service.Version) {
        logger.warn(`${service.Name} ${service.Version} TODO service versions dont match - implement handling`);
      }
      if (obj.DeploymentId !== service.DeploymentId) {
        logger.warn(`${service.Name} ${service.Version} TODO deployment ids dont match - implement handling`);
      }
    });

    let serviceInstances = _.filter(instances, instance => _.some(instance.Services, { Name: service.Name }));
    let healthyNodes = _.filter(serviceInstances, (instance) => instance.OverallHealth.Status === Enums.HEALTH_STATUS.Healthy);
    let instancesHealthCount = healthyNodes.length + '/' + serviceInstances.length;
    let serviceHealthChecks = getServiceChecksInfo(serviceObjects);

    return {
      Name: service.Name,
      Version: service.Version,
      Slice: service.Slice,
      DeploymentId: service.DeploymentId,
      InstancesNames: _.map(serviceInstances, 'Name'),
      InstancesHealthCount: instancesHealthCount,
      OverallHealth: getServiceOverallHealth(serviceHealthChecks, serviceInstances),
      HealthChecks: serviceHealthChecks,
    };
  });

  // TODO(filip): if services object not empty - means that there's some instance
  // that has Service that's not in target state

  return services;
}

module.exports = co.wrap(getServicesTargetState);