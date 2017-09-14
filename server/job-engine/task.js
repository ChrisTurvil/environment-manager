'use strict';

let assert = require('assert');
let { Graph, alg: { isAcyclic } } = require('graphlib');

const STATUS = {
  pending: 'pending',
  queued: 'queued',
  running: 'running',
  completed: 'completed',
  failed: 'failed'
};

let { pending, queued, running, completed, failed } = STATUS;

let g = new Graph({ directed: true });
g.setNodes(Object.keys(STATUS).map(k => STATUS[k]));
g.setEdge(pending, queued);
g.setEdge(queued, running);
g.setEdge(running, completed);
g.setEdge(running, failed);
assert(isAcyclic(g));

const terminal = g.sinks();

function isTerminalState(s) {
  return terminal.some(t => t === s);
}

module.exports = {
  STATUS,
  isTerminalState,
  terminalStates: terminal
};
