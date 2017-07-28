/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let { getByName: getAccount } = require('modules/awsAccounts');
let ScanImages = require('queryHandlers/ScanImages');
let ScanCrossAccountImages = require('queryHandlers/ScanCrossAccountImages');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;

  let imagesP = (accountName !== undefined
    ? getAccount(accountName)
      .then(({ AccountNumber }) => ScanImages({ accountId: `${AccountNumber}` }))
    : ScanCrossAccountImages());

  return imagesP
    .then(data => (stable !== undefined
      ? _.filter(data, { IsStable: stable })
      : data))
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getImages
};
