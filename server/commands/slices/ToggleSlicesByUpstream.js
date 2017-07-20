/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let {
  orchestrate,
  ToggleUpstreamByNameVerifier,
  UpstreamProvider,
  UpstreamToggler
 } = require('../utils/toggleSlices');

module.exports = function ToggleSlicesByUpstream(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.upstreamName, 'string');

  return Promise.resolve().then(() => {
    let resourceName = `Upstream named "${command.upstreamName}" in "${command.environmentName}" environment`;
    let provider = UpstreamProvider(command, resourceName);
    let verifier = ToggleUpstreamByNameVerifier(resourceName);
    let toggler = UpstreamToggler(command);
    return orchestrate(provider, verifier, toggler);
  });
};
