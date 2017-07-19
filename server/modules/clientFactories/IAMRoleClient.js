/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { getByName: getAccount } = require('modules/awsAccounts');
let AwsError = require('modules/errors/AwsError.class');
let RoleNotFoundError = require('modules/errors/RoleNotFoundError.class');
let { createIAMClient } = require('modules/amazon-client/childAccountClient');

module.exports = function IAMRoleClient(accountName) {
  this.get = function (parameters) {
    return getAccount(accountName)
      .then(({ RoleArn: roleArn }) => createIAMClient({ roleArn }))
      .then(({ getRole }) => getRole({ RoleName: parameters.roleName }).promise())
      .then(({ Role }) => Promise.resolve(Role))
      .catch(error => Promise.reject(error.code === 'NoSuchEntity'
        ? new RoleNotFoundError(`Role '${parameters.roleName}' not found.`)
        : new AwsError(error.message)));
  };
};
