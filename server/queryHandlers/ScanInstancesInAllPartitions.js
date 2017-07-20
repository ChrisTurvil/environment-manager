/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let mapAcrossPartitions = require('modules/queryHandlersUtil/mapAcrossPartitions');
let ScanInstances = require('queryHandlers/ScanInstances');
let { scanPartitions } = require('modules/amazon-client/awsConfiguration');

module.exports = function (query) {
  return scanPartitions()
    .then(mapAcrossPartitions(partition => ScanInstances(Object.assign({}, query, { partition }))));
};
