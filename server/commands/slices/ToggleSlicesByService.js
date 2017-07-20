/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let toggleSlices = require('../utils/toggleSlices');
let UpstreamProvider = toggleSlices.UpstreamProvider;
let ToggleUpstreamByServiceVerifier = toggleSlices.ToggleUpstreamByServiceVerifier;
let UpstreamToggler = toggleSlices.UpstreamToggler;
let orchestrate = toggleSlices.orchestrate;

module.exports = function ToggleSlicesByService(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.serviceName, 'string');

  return Promise.resolve().then(() => {
    let resourceName = `Upstream for "${command.serviceName}" service in "${command.environmentName}" environment`;
    let provider = new UpstreamProvider(command, resourceName);
    let verifier = new ToggleUpstreamByServiceVerifier(command);
    let toggler = new UpstreamToggler(command);
    return orchestrate(provider, verifier, toggler);
  });
};
