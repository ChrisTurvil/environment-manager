/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'ConfigEnvironmentTypes';
const TTL = 600; // seconds

let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let cachedSingleDynamoTable = require('modules/data-access/cachedSingleDynamoTable');

module.exports = cachedSingleDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });
