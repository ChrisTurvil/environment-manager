/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanAllPartitions = require('modules/queryHandlersUtil/scanAllPartitions');
let ScanAutoScalingGroups = require('queryHandlers/ScanAutoScalingGroups');

module.exports = function (query) {
  return scanAllPartitions(partition => ScanAutoScalingGroups(Object.assign({}, query, { partition })));
};
