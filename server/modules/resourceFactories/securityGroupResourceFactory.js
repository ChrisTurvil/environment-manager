/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { createEC2Client } = require('modules/amazon-client/childAccountClient');
let SecurityGroupResource = require('./SecurityGroupResource');

module.exports = partition => createEC2Client(partition).then(client => new SecurityGroupResource(client));
