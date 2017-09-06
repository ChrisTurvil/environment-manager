'use strict';

let Promise = require('bluebird');
let fp = require('lodash/fp');
let serviceName = require('modules/serviceName');
let { getService } = require('modules/service-discovery');
let { get } = require('modules/data-access/loadBalancerUpstreams');

function getCanonicalUpstreamKey(environment, service) {
  return `/${environment}_${environment}-${service}/config`;
}

function getActiveDiscoService(upstream) {
  return fp.flow(
    fp.get('Hosts'),
    fp.filter(h => h !== null && h !== undefined && h.State === 'up'),
    fp.map(h => h.DnsName),
    fp.uniq,
    (slices) => {
      if (slices.length === 1) {
        return slices[0];
      } else {
        throw new Error(`Expected one active slice but found ${slices.length}: upstream=${upstream.Key}`);
      }
    }
  )(upstream);
}

function getVersionAsync(discoService) {
  let { environment, service, slice } = serviceName.parse(discoService);
  return getService(environment, serviceName.formatSQN(service, slice))
    .then(({ ServiceID, ServiceTags: { version } = {} }) => {
      if (ServiceID === undefined) {
        return Promise.reject(new Error(`Service not found in catalog: ${discoService}`));
      } else if (version === undefined) {
        return Promise.reject(new Error(`Service has no version tag: ${discoService}`));
      } else {
        return version;
      }
    });
}

function getActiveDiscoServiceVersionAsync(environment, service) {
  let upstreamKey = getCanonicalUpstreamKey(environment, service);
  let discoServiceP = Promise.resolve()
    .then(() => get({ Key: upstreamKey }))
    .then(upstream => upstream || Promise.reject(new Error(`Upstream not found: ${upstreamKey}`)))
    .then(getActiveDiscoService);
  let versionP = discoServiceP.then(getVersionAsync);
  return Promise.join(discoServiceP, versionP, (discoService, version) => ({ discoService, version }));
}

module.exports = {
  getActiveDiscoServiceVersionAsync
};
