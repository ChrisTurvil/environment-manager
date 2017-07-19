/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let keypairFactory = require('modules/factories/keypairFactory');

module.exports = function GetKeyPairQueryHandler({ partitions, keyName }) {
  assert(partitions);
  assert(keyName);

  let parameters = { partitions };
  return keypairFactory.create(parameters)
    .then(resource => resource.get({ keyName }));
};
