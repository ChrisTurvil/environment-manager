/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanAllPartitions = require('modules/queryHandlersUtil/scanAllPartitions');
let ScanImages = require('queryHandlers/ScanImages');

module.exports = function (query) {
  return scanAllPartitions(partition => ScanImages(Object.assign({}, query, { partition })));
};
