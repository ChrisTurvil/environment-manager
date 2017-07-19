/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { createASGClient } = require('modules/amazon-client/childAccountClient');
let AsgScheduledActionsResource = require('modules/resourceFactories/AsgScheduledActionsResource');
let logger = require('modules/logger');

module.exports = (partition) => {
  logger.debug(`Getting ASG client for account "${JSON.stringify(partition)}"...`);
  return createASGClient(partition)
    .then(client => new AsgScheduledActionsResource(client));
};
