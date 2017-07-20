/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let singleDynamoTable = require('modules/data-access/singleDynamoTable');
let dynamoTableCache = require('modules/data-access/dynamoTableCache');

function factory(physicalTableName, { ttl }) {
  let cachedTable = dynamoTableCache(physicalTableName, { ttl });
  return singleDynamoTable(physicalTableName, cachedTable);
}

module.exports = factory;
