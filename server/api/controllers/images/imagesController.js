/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { scanPartitions } = require('modules/amazon-client/awsConfiguration');
let { filter } = require('lodash/fp');
let ScanImages = require('queryHandlers/ScanImages');
let getPartitionsInAccount = require('modules/amazon-client/getPartitionsInAccount');
let mapAcrossPartitions = require('modules/queryHandlersUtil/mapAcrossPartitions');

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;
  let query = { filter: {} };

  let partitionsP = accountName !== undefined ? getPartitionsInAccount(accountName) : scanPartitions();

  return partitionsP
    .then(mapAcrossPartitions(partition => ScanImages(Object.assign({}, query, { partition }))))
    .then((stable !== undefined ? filter(({ IsStable }) => IsStable === stable) : ps => ps))
    .then(ps => res.json(ps));
}

module.exports = {
  getImages
};
