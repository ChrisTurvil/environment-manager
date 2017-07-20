/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let mapAcrossPartitions = require('modules/queryHandlersUtil/mapAcrossPartitions');
let ScanImages = require('queryHandlers/ScanImages');
let { scanPartitions } = require('modules/amazon-client/awsConfiguration');

module.exports = function (query) {
  return scanPartitions()
    .then(mapAcrossPartitions(partition => ScanImages(Object.assign({}, query, { partition }))));
};
