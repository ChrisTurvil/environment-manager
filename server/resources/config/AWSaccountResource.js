/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

﻿module.exports = {
  name: 'config/awsAccounts',
  type: 'dynamodb/table',
  tableName: 'InfraConfigAccounts',
  keyName: 'AccountNumber',
  queryable: true,
  perAccount: false,
  disableAutoRoute: true,
};
