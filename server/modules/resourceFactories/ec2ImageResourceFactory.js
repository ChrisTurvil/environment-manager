/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let Promise = require('bluebird');
let _ = require('lodash');
let { createEC2Client } = require('modules/amazon-client/childAccountClient');
let awsAccounts = require('modules/awsAccounts');
let cacheManager = require('modules/cacheManager');

const USE_CACHE = true;

function getImagesVisibleToAccount(accountId, region, filter) {
  function getImagesOwners() {
    return awsAccounts.getAMIsharingAccounts()
      .then(accounts => _.uniq(accounts.concat(accountId))
        .map(_.toString));
  }

  function buildRequest(query) {
    let Filters = [];
    if (query) {
      // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
      Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.concat(q[1]) }));
    }

    Filters.push({ Name: 'state', Values: ['available'] });
    Filters.push({ Name: 'is-public', Values: ['false'] });
    Filters.push({ Name: 'image-type', Values: ['machine'] });

    return getImagesOwners().then(Owners => ({ Filters, Owners }));
  }

  return Promise.join(
    createEC2Client(accountId, region),
    buildRequest(filter),
    (client, request) => client.describeImages(request).promise())
    .then(data => data.Images);
}

const imagesCache = cacheManager.create('ImagesCache', getImagesVisibleToAccount, { stdTTL: 30 * 60 });

function ImageResource() {
  this.all = function cachedGetAll({ accountId, region, filter = {} }) {
    assert(accountId !== undefined, 'accountId is required');
    assert(region !== undefined, 'region is required');

    let hasFilter = Object.keys(filter).length > 0;

    if (hasFilter || !USE_CACHE) {
      return getImagesVisibleToAccount(accountId, region, filter);
    } else {
      return imagesCache.get(accountId);
    }
  };
}

module.exports = new ImageResource();
