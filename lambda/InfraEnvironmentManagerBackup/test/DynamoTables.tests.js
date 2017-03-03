/* eslint-env mocha */

'use strict';

let DynamoTable = require('../DynamoTable');
let sut = require('../DynamoTables');
require('should');

describe('DynamoTables', function () {
    context('when the backup description is valid', function () {
        let args = {
            masterAccount: { name: 'master', number: '0' },
            masterTables: [
                'master-tab-1',
                'master-tab-2'
            ],
            childAccounts: [
                { name: 'child-1', number: '1' },
                { name: 'child-2', number: '2' }
            ],
            childTables: [
                'child-tab-1',
                'child-tab-2'
            ]
        };

        let result;
        before(function () {
            result = sut(args);
        });

        it('it returns an array of results with the expected length', function () {
            result.should.have.length(6);
        });
        it('it returns instances of DynamoTable', function () {
            result.should.matchEach(x => x.should.be.instanceOf(DynamoTable));
        });
        it('it returns the expected table and account names', function () {
            result.map(x => [x.name, x.account.toString()]).should.eql([
                ['master-tab-1', 'master[0]'],
                ['master-tab-2', 'master[0]'],
                ['child-tab-1', 'child-1[1]'],
                ['child-tab-2', 'child-1[1]'],
                ['child-tab-1', 'child-2[2]'],
                ['child-tab-2', 'child-2[2]']
            ]);
        });
    });
    context('when the table to backup is ConfigLBUpstream', function () {
        it('it uses a different stringify function', function() {
            let args = {
                masterAccount: { name: 'master', number: '0' },
                masterTables: [
                    'my-prefix_configlbupstream',
                    'another-table'
                ],
                childAccounts: [],
                childTables: []
            };
            let result = sut(args);
            result[0].stringify([{ value: 3 }]).should.not.eql(result[1].stringify([{ value: 3 }]));
        });
    });
});