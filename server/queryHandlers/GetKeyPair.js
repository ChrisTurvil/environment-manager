/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let keypairFactory = require('modules/factories/keypairFactory');

module.exports = function GetKeyPairQueryHandler({ awsOptions, keyName }) {
  assert(awsOptions);
  assert(keyName);

  let parameters = { awsOptions };
  return keypairFactory.create(parameters)
    .then(resource => resource.get({ keyName }));
};
