'use strict';

let fp = require('lodash/fp');
let taskRules = require('task-rules');
let log = require('../log');
let { isTerminalState } = require('../task');

function goal({ Status }) {
  return isTerminalState(Status);
}

function applyTaskRules(job) {
  let rules = taskRules(job);
  return fp.flow(
    fp.get(['Tasks']),
    fp.toPairs,
    fp.map(rules.apply),
    fp.flatten
  )(job);
}

let jobRules = [
  [() => true, applyTaskRules]
  // [hasNoReachableTasks, terminateJob]
];

function apply(job) {
  return goal(job)
    ? []
    : fp.flow(
      fp.filter(([predicate]) => predicate(job)),
      fp.map(action => action(job)),
      fp.flatten
    )(jobRules);
}

module.exports = { apply };
