'use strict';

let commands = require('modules/environment-sync/commands');
let jobsDb = require('')

let [blocked, pending, queued, running, completed, failed] = ['blocked', 'pending', 'queued', 'running', 'completed', 'failed'];

let jobTemplate = {
  JobId: '',
  JobName: '',
  StartedAt: '',
  ExpiresAt: '',
  Status: '',
  Tasks: {
    'StartDeployment1': {
      Status: '',
      StartedAt: '',
      ExpiresAt: '',
      Command: '',
      Result: ''
    },
    'AwaitDeployment1': {
      DependsOn: ['StartDeployment1'],
      Status: '',
      StartedAt: '',
      ExpiresAt: '',
      Command: '',
      Result: ''
    },
    'Toggle1': {
      DependsOn: ['AwaitDeployment1'],
      Status: '',
      StartedAt: '',
      ExpiresAt: '',
      Command: '',
      Result: ''
    }
  }
};

function isTerminal(status) {
  return status === blocked || status === completed || status === failed;
}

function isRunnable(tasks, { DependsOn = [], Status }) {
  return Status === pending && DependsOn.every(t => tasks[t].Status === completed);
}

function isBlocked(tasks, { DependsOn = [], Status }) {
  if (DependsOn.some(t => tasks[t].Status === failed)) {
    return true;
  }
}

function run(state, task) {
  let { Command } = task;
  let command = commands[Command];
  if (command) {
    command(state, task);
    task.Status = running;
  }
}

function aggregateStatus(tasks) {
  let order = [running, pending, queued, failed, blocked, completed];
  let rank = status => order.indexOf(status);
  return tasks.aggregate((acc, { Status: nxt }) => (rank(acc) < rank(nxt) ? acc : nxt), completed);
}

let rules = [
  [({ Tasks }) => Tasks.some(isRunnable.bind(null, Tasks)), ({ Tasks }) => Tasks.filter(isRunnable.bind(null, Tasks)).foreach((task) => { task.Status = queued; })], // Mark runnable as queued
  [({ Tasks }) => Tasks.some(({ Status }) => Status === queued), state => state.Tasks.filter(({ Status }) => Status === queued).map(task => run(state, task))], // Run queued and mark as running
  [({ Tasks }) => Tasks.every(({ Status }) => isTerminal(Status)), (state) => { state.Status = aggregateStatus(state.Tasks); }], // Update the job status if all tasks are at terminal status
  [({ Tasks }) => Tasks.some(isBlocked.bind(null, Tasks)), ({ Tasks }) => Tasks.filter(isBlocked.bind(null, Tasks)).foreach((task) => { task.Status = blocked; })], // Mark tasks as blocked that depend on failed tasks

];

let goal = ({ ExpiresAt, Status }) => isTerminal(Status) || ExpiresAt >= now;

function main(job) {
  function loop() {
    rules.forEach()
  }
}