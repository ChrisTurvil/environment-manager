/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let fp = require('lodash/fp');
let ScanImagesInAllPartitions = require('queryHandlers/ScanImagesInAllPartitions');

class Image {

  constructor(data) {
    _.assign(this, data);
  }

  static getById(id) {
    return ScanImagesInAllPartitions()
      .then(fp.find(({ ImageId }) => ImageId === id))
      .then(image => new Image(image));
  }
}

module.exports = Image;
