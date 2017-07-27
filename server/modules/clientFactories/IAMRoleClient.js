/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let AwsError = require('modules/errors/AwsError.class');
let RoleNotFoundError = require('modules/errors/RoleNotFoundError.class');
let { createIAMClient } = require('modules/amazon-client/childAccountClient');

module.exports = function IAMRoleClient(accountName) {
  this.get = function (parameters) {
    return co(function* () {
      let client = yield createIAMClient(accountName);
      let role = yield client.getRole({ RoleName: parameters.roleName }).promise().then(

        response => Promise.resolve(response.Role),

        error => Promise.reject(error.code === 'NoSuchEntity'
          ? new RoleNotFoundError(`Role '${parameters.roleName}' not found.`)
          : new AwsError(error.message))

      );

      return role;
    });
  };
};
