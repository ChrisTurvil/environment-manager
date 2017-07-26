/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let fp = require('lodash/fp');
let co = require('co');
let getAllASGs = require('queryHandlers/ScanCrossAccountAutoScalingGroups');
let getAccountASGs = require('queryHandlers/ScanAutoScalingGroups');
let { get: getASG } = require('modules/resourceFactories/AsgResource');
let asgips = require('modules/data-access/asgips');
let GetLaunchConfiguration = require('queryHandlers/GetLaunchConfiguration');
let SetLaunchConfiguration = require('commands/launch-config/SetLaunchConfiguration');
let SetAutoScalingGroupSize = require('commands/asg/SetAutoScalingGroupSize');
let SetAutoScalingGroupSchedule = require('commands/asg/SetAutoScalingGroupSchedule');
let UpdateAutoScalingGroup = require('commands/asg/UpdateAutoScalingGroup');
let GetAutoScalingGroupScheduledActions = require('queryHandlers/GetAutoScalingGroupScheduledActions');
let getASGReady = require('modules/environment-state/getASGReady');
let sns = require('modules/sns/EnvironmentManagerEvents');
let deleteAutoScalingGroup = require('commands/asg/deleteAutoScalingGroup');
let { getPartitionForEnvironment } = require('modules/amazon-client/awsPartitions');
let { getByName: getAccount } = require('modules/awsAccounts');
let withValidation = require('modules/validate');
let environmentExistsRule = require('modules/validate/rule/environmentExists');

function environmentExists(req) {
  return environmentExistsRule(req.swagger.params.environment.value)
    .then(err => Object.assign(err, { status: '400' }));
}

function respondWithErrors(errors) {
  // Error format:  http://jsonapi.org/format/#errors
  let statuses = fp.flow(fp.map(fp.get('status')), fp.uniq)(errors);
  let status = (statuses.length === 1) ? statuses[0] : '400';
  return response => response.status(status).json({ errors });
}

/**
 * GET /asgs
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const environment = req.swagger.params.environment.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: co(function* () {
      let list;
      if (environment !== undefined) {
        let { accountId, region } = yield getPartitionForEnvironment(environment);
        let t = yield getAccountASGs({ accountId, region });
        list = t.filter(asg => asg.getTag('Environment') === environment);
      } else if (accountName !== undefined) {
        let { AccountNumber: accountId } = yield getAccount(accountName);
        list = yield getAccountASGs({ accountId });
      } else {
        list = yield getAllASGs();
      }
      return rsp => rsp.json(list);
    }),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /asgs/{name}
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => getASG({ environmentName, name: autoScalingGroupName })
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}


/**
 * GET /asgs/{name}/ready
 */
function getAsgReadyByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => getASGReady({
      autoScalingGroupName,
      environmentName
    }).then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}


/**
 * GET /asgs/{name}/ips
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => getPartitionForEnvironment(environmentName)
      .then(({ accountId }) => asgips.get(accountId, { AsgName: key }))
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /asgs/{name}/launch-config
 */
function getAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => GetLaunchConfiguration({ environmentName, autoScalingGroupName })
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /asgs/{name}/scaling-schedule
 */
function getScalingSchedule(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => GetAutoScalingGroupScheduledActions({ environmentName, autoScalingGroupName })
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}
 */
function putAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const parameters = req.swagger.params.body.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => UpdateAutoScalingGroup({
      environmentName,
      autoScalingGroupName,
      parameters
    })
      .then(data => res.json(data))
      .then(sns.publish({
        message: JSON.stringify({
          Endpoint: {
            Url: `/asgs/${autoScalingGroupName}`,
            Method: 'PUT'
          }
        }),
        topic: sns.TOPICS.OPERATIONS_CHANGE,
        attributes: {
          Environment: environmentName,
          Action: sns.ACTIONS.PUT,
          ID: autoScalingGroupName
        }
      }))
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * DELETE /asgs/{name}
 */
function deleteAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => co(function* () {
      deleteAutoScalingGroup({ environmentName, autoScalingGroupName })
        .then((status) => {
          res.json({
            Ok: status
          });
        })
        .then(sns.publish({
          message: JSON.stringify({
            Endpoint: {
              Url: `/asgs/${autoScalingGroupName}`,
              Method: 'DELETE'
            }
          }),
          topic: sns.TOPICS.OPERATIONS_CHANGE,
          attributes: {
            Environment: environmentName,
            Action: sns.ACTIONS.DELETE,
            ID: autoScalingGroupName
          }
        }));
    }).then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/scaling-schedule
 */
function putScalingSchedule(req, res, next) {
  const body = req.swagger.params.body.value;
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => co(function* () {
      let data = {};
      let schedule = body.schedule;
      let propagateToInstances = body.propagateToInstances;

      data = yield SetAutoScalingGroupSchedule({
        environmentName,
        autoScalingGroupName,
        schedule,
        propagateToInstances
      });

      res.json(data);
    })
      .then(sns.publish({
        message: JSON.stringify({
          Endpoint: {
            Url: `/asgs/${autoScalingGroupName}/scaling-schedule`,
            Method: 'PUT'
          }
        }),
        topic: sns.TOPICS.OPERATIONS_CHANGE,
        attributes: {
          Environment: environmentName,
          Action: sns.ACTIONS.PUT,
          ID: autoScalingGroupName
        }
      }))
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/size
 */
function putAsgSize(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const body = req.swagger.params.body.value;
  const autoScalingGroupMinSize = body.min;
  const autoScalingGroupDesiredSize = body.desired;
  const autoScalingGroupMaxSize = body.max;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => co(function* () {
      SetAutoScalingGroupSize({
        environmentName,
        autoScalingGroupName,
        autoScalingGroupMinSize,
        autoScalingGroupDesiredSize,
        autoScalingGroupMaxSize
      })
        .then(data => res.json(data))
        .then(sns.publish({
          message: JSON.stringify({
            Endpoint: {
              Url: `/asgs/${autoScalingGroupName}/size`,
              Method: 'PUT'
            }
          }),
          topic: sns.TOPICS.OPERATIONS_CHANGE,
          attributes: {
            Environment: environmentName,
            Action: sns.ACTIONS.PUT,
            ID: autoScalingGroupName
          }
        }));
    })
      .then(data => rsp => rsp.json(data)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/launch-config
 */
function putAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const data = req.swagger.params.body.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return withValidation({
    rules: [environmentExists],
    validContinuation: () => co(function* () {
      SetLaunchConfiguration({
        environmentName,
        autoScalingGroupName,
        data
      })
        .then(res.json.bind(res))
        .then(sns.publish({
          message: JSON.stringify({
            Endpoint: {
              Url: `/asgs/${autoScalingGroupName}/launch-config`,
              Method: 'PUT'
            }
          }),
          topic: sns.TOPICS.OPERATIONS_CHANGE,
          attributes: {
            Environment: environmentName,
            Action: sns.ACTIONS.PUT,
            ID: autoScalingGroupName
          }
        }));
    }).then(content => rsp => rsp.json(content)),
    invalidContinuation: respondWithErrors
  })(req)
    .then(send => send(res))
    .catch(next);
}

module.exports = {
  getAsgs,
  getAsgByName,
  getAsgReadyByName,
  getAsgIps,
  getAsgLaunchConfig,
  putScalingSchedule,
  getScalingSchedule,
  deleteAsg,
  putAsg,
  putAsgSize,
  putAsgLaunchConfig
};
