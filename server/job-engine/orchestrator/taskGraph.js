'use strict';

let assert = require('assert');
let { Graph, alg: { isAcyclic, preorder } } = require('graphlib');
let { terminalStates, STATUS: { pending, completed, failed } } = require('../task');

function toPairs(obj) {
  return Object.keys(obj).map(key => [key, obj[key]]);
}

function taskGraph(pairs, reverseEdges = false) {
  let graph = new Graph({ directed: true });
  pairs.forEach(([taskId, task]) => { graph.setNode(taskId, task); });
  pairs.forEach(([taskId, task]) => {
    let { DependsOn = [] } = task;
    DependsOn.forEach((dependency) => {
      let vertices = [taskId, dependency];
      if (reverseEdges) {
        vertices.reverse();
      }
      let [tail, head] = vertices;
      graph.setEdge(tail, head);
    });
  });
  assert(isAcyclic(graph), 'The task graph must be acyclic.');
  return graph;
}

function getRunnableTasks(tasks) {
  let pairs = toPairs(tasks);
  let graph = taskGraph(pairs);
  let completedTasks = pairs.filter(([, { Status }]) => Status === completed).map(([taskId]) => taskId);
  completedTasks.forEach(taskId => graph.removeNode(taskId));
  return graph.sinks().filter(taskId => tasks[taskId].Status === pending);
}

function getBlockedTasks(tasks) {
  let pairs = toPairs(tasks);
  let graph = taskGraph(pairs, true);
  let failedTasks = pairs.filter(([, { Status }]) => Status === failed).map(([taskId]) => taskId);
  return preorder(graph, failedTasks)
    .filter(taskId => !terminalStates.some(s => s === tasks[taskId].Status));
}

module.exports = {
  getRunnableTasks,
  getBlockedTasks
};
