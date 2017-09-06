'use strict';

let proxyquire = require('proxyquire').noCallThru();
let sinon = require('sinon');
require('should');

const MUT = 'modules/environment-sync/service-info';
const loadBalancerUpstreamsModule = 'modules/data-access/loadBalancerUpstreams';
const serviceDiscoveryModule = 'modules/service-discovery';

function fake(fakes) {
  let defaults = {
    [loadBalancerUpstreamsModule]: { get: () => undefined },
    [serviceDiscoveryModule]: { getService: () => undefined }
  };
  return Object.assign({}, defaults, fakes);
}

describe('service-info', function () {
  describe('getActiveDiscoServiceVersionAsync', function () {
    it('requests an upstream with the canonical name for the service', function () {
      let fakes = fake({
        [loadBalancerUpstreamsModule]: { get: sinon.stub() }
      });
      let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
      return getActiveDiscoServiceVersionAsync('env', 'svc')
        .catch(() => undefined)
        .finally(() => sinon.assert.calledWith(fakes[loadBalancerUpstreamsModule].get, { Key: 'env_env-svc/config' }));
    });
    context('when there is no canonical upstream for the service', function () {
      it('fails with a helpful message', function () {
        let fakes = fake({
          [loadBalancerUpstreamsModule]: { get: () => Promise.resolve(null) }
        });
        let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
        return getActiveDiscoServiceVersionAsync('env', 'svc')
          .should.be.rejectedWith(/Upstream not found/);
      });
    });
    context('when there is a canonical upstream for the service', function () {
      function stubResponses(upstream, discoService) {
        return fake({
          [loadBalancerUpstreamsModule]: {
            get: () => Promise.resolve(upstream)
          },
          [serviceDiscoveryModule]: {
            getService: () => Promise.resolve(discoService)
          }
        });
      }
      context('and the upstream has one active host', function () {
        let stubDiscoResponse = stubResponses.bind(null, { Hosts: [{ DnsName: 'env-svc-blue', State: 'up' }] });
        context('and the active host is a service in the catalog', function () {
          context('and the catalog service has a version tag', function () {
            it('returns the service and its version', function () {
              let fakes = stubDiscoResponse({ ServiceID: '?', ServiceTags: { version: '1.0.0' } });
              let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
              return getActiveDiscoServiceVersionAsync('env', 'svc')
                .should.finally.eql({ discoService: 'env-svc-blue', version: '1.0.0' });
            });
          });
          context('but the catalog service has no version tag', function () {
            it('fails with a helpful message', function () {
              let fakes = stubDiscoResponse({ ServiceID: '?', ServiceTags: {} });
              let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
              return getActiveDiscoServiceVersionAsync('env', 'svc')
                .should.be.rejectedWith(/Service has no version tag/);
            });
          });
        });
        context('but the active host is not a service in the catalog', function () {
          it('fails with a helpful message', function () {
            let fakes = stubDiscoResponse([]);
            let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
            return getActiveDiscoServiceVersionAsync('env', 'svc')
              .should.be.rejectedWith(/Service not found in catalog/);
          });
        });
      });
      context('but the upstream has no active hosts', function () {
        it('fails with a helpful message', function () {
          let fakes = stubResponses({ Hosts: [{ DnsName: 'env-svc-blue', State: 'down' }] });
          let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
          return getActiveDiscoServiceVersionAsync('env', 'svc')
          .should.be.rejectedWith(/Expected one active slice but found 0/);
        });
      });
      context('but the upstream has many unique active hosts', function () {
        it('fails with a helpful message', function () {
          let fakes = stubResponses({
            Hosts: [
              { DnsName: 'env-svc-blue', State: 'up' },
              { DnsName: 'env-svc-green', State: 'up' }
            ]
          });
          let { getActiveDiscoServiceVersionAsync } = proxyquire(MUT, fakes);
          return getActiveDiscoServiceVersionAsync('env', 'svc')
          .should.be.rejectedWith(/Expected one active slice but found 2/);
        });
      });
    });
  });
});
