/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let winston = require('winston');

let AWS = require('aws-sdk');

let config = require('config/');
const EM_LOG_LEVEL = config.get('EM_LOG_LEVEL').toLowerCase();
let fp = require('lodash/fp');

// Set up formatter - if local, leave undefined
let formatter;
if (true) {
  // if (config.get('IS_PRODUCTION') === true) {
  formatter = function (options) {
    let entry = {
      message: options.message,
      level: options.level,
      name: 'environment-manager',
      eventtype: fp.compose(fp.defaultTo('default'), fp.get(['meta', 'eventtype']))(options),
      releaseversion: process.env.RELEASE_VERSION || config.get('APP_VERSION'),
      meta: fp.compose(fp.omit('eventtype'), fp.get('meta'))(options)
    };
    return JSON.stringify(entry);
  };
}

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: EM_LOG_LEVEL,
      showLevel: false,
      formatter
    })
  ]
});

if (config.get('IS_PRODUCTION') === true) {
  // Globally configure aws-sdk to log all activity.
  AWS.config.update({
    logger: {
      log: (level, message, meta) => logger.log(level, message, fp.assign({ eventtype: 'aws' })(meta))
    }
  });
}

logger.info(`Starting logger with log level ${EM_LOG_LEVEL}`);

module.exports = logger;
