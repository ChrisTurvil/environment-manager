/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanAllPartitions = require('modules/queryHandlersUtil/scanAllPartitions');
let ScanInstances = require('queryHandlers/ScanInstances');

module.exports = function (query) {
  return scanAllPartitions(partition => ScanInstances(Object.assign({}, query, { partition })));
};
