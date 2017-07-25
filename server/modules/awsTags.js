/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getTagValues(tagName) {
  return ({ Tags }) => Tags.filter(({ Key }) => Key === tagName).map(({ Value }) => Value);
}

function hasTag(tagName, predicate = x => true) {
  return ({ Tags }) => Tags.some(({ Key, Value }) => Key === tagName && predicate(Value));
}

module.exports = {
  getTagValues,
  hasTag
};
