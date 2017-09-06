'use strict';

let Promise = require('bluebird');
let guid = require('uuid/v1');
let deploy = require('commands/deployments/DeployService');
let { parse } = require('modules/serviceName');
let logger = require('modules/logger');
let { getActiveDiscoServiceVersionAsync } = require('modules/environment-sync/service-info');

function nextSlice(slice) {
  if (/blue/i.test(slice)) {
    return 'green';
  } else if (/green/i.test(slice)) {
    return 'blue';
  } else {
    return slice;
  }
}

function runJob(myEnvironment, serviceEnvironmentPairs) {
  function describeServiceAction({ Environment, Service }) {
    let myActiveServiceP = getActiveDiscoServiceVersionAsync(myEnvironment, Service);
    let theirActiveServiceP = getActiveDiscoServiceVersionAsync(Environment, Service);
    return Promise.join(myActiveServiceP, theirActiveServiceP, (myActiveService, theirActiveService) => {
      let targetSlice = parse(myActiveService.discoService).slice;
      if (myActiveService.version === theirActiveService.version) {
        return {
          InfoLocation: '',
          MyVersion: myActiveService.version,
          Service,
          TheirEnvironment: Environment,
          TheirVersion: theirActiveService.version
        };
      }
      let deployParams = Object.assign(
        {
          commandId: guid(),
          name: 'DeployService',
          environmentName: myEnvironment,
          serviceName: Service,
          serviceVersion: theirActiveService.version,
          mode: targetSlice ? 'bg' : 'overwrite',
          isDryRun: false
        },
        targetSlice ? { serviceSlice: nextSlice(targetSlice) } : {}
      );
      return deploy(deployParams)
        .then(({ id }) => ({
          InfoLocation: `/api/v1/deployments/${id}`,
          MyVersion: myActiveService.version,
          Service,
          TheirEnvironment: Environment,
          TheirVersion: theirActiveService.version
        }));
    })
      .catch((error) => {
        logger.error(error);
        return {
          InfoLocation: '',
          MyVersion: '',
          Service,
          TheirEnvironment: Environment,
          TheirVersion: ''
        };
      });
  }
  return Promise.map(serviceEnvironmentPairs, describeServiceAction);
}

module.exports = {
  runJob
};
