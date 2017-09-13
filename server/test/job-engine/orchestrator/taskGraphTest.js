'use strict';

require('should');
let { getBlockedTasks, getRunnableTasks } = require('job-engine/orchestrator/taskGraph');
let { STATUS, terminalStates } = require('job-engine/task');
let { pending, queued, running, completed, failed } = STATUS;

describe('taskGraph', function () {
  describe('getRunnableTasks', function () {
    it('a pending task is runable', function () {
      getRunnableTasks({ a: { Status: pending } }).should.eql(['a']);
    });
    Object.keys(STATUS).map(k => STATUS[k]).filter(status => status !== pending).forEach((status) => {
      it(`a ${status} task is not runable`, function () {
        getRunnableTasks({ a: { Status: status } }).should.eql([]);
      });
    });
    it('a pending task that depends only on completed tasks is runable', function () {
      getRunnableTasks({
        a: { Status: completed },
        b: { Status: completed },
        c: { DependsOn: ['a', 'b'], Status: pending }
      }).should.eql(['c']);
    });
    Object.keys(STATUS).map(k => STATUS[k]).filter(status => status !== completed).forEach((status) => {
      it(`a pending task that depends on a completed task and a ${status} task is not runable`, function () {
        getRunnableTasks({
          a: { Status: completed },
          b: { Status: status },
          c: { DependsOn: ['a', 'b'], Status: pending }
        }).should.not.matchAny('c');
      });
    });
  });
  describe('getBlockedTasks', function () {
    it('a failed task that depends on a failed task is not blocked', function () {
      getBlockedTasks({
        a: { Status: failed },
        b: { Status: failed, DependsOn: ['a'] }
      }).should.eql([]);
    });
    terminalStates.forEach((status) => {
      it(`a ${status} task that depends on a failed task is not blocked`, function () {
        getBlockedTasks({
          a: { Status: failed },
          b: { Status: status, DependsOn: ['a'] }
        }).should.eql([]);
      });
    });
    Object.keys(STATUS).map(k => STATUS[k]).filter(status => !terminalStates.some(s => s === status)).forEach((status) => {
      it(`a ${status} task that depends on a failed task is blocked`, function () {
        getBlockedTasks({
          a: { Status: failed },
          b: { Status: status, DependsOn: ['a'] }
        }).should.eql(['b']);
      });
    });
    Object.keys(STATUS).map(k => STATUS[k]).filter(status => !terminalStates.some(s => s === status)).forEach((status) => {
      it(`a ${status} task that transitively depends on a failed task is blocked`, function () {
        getBlockedTasks({
          a: { Status: failed },
          b: { Status: status, DependsOn: ['a'] },
          c: { Status: status, DependsOn: ['b'] },
          d: { Status: status, DependsOn: ['b'] }
        }).should.eql(['b', 'c', 'd']);
      });
    });
  });
});
