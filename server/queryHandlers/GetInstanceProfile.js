/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let iamInstanceProfileResourceFactory = require('modules/resourceFactories/iamInstanceProfileResourceFactory');

module.exports = function GetInstanceProfile(query) {
  return iamInstanceProfileResourceFactory(query.partition)
    .then(resource => resource.get({ instanceProfileName: query.instanceProfileName })
    );
};
