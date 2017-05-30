'use strict';

const R = require('ramda');
let test = require('tape');
let { streamArn } = require('./dynamodb');
let sut = require('./audit.template');
let { ref } = require('./template');

test('audit: An audit trigger is created for a stack output if it is a DynamoDB stream', (t) => {
    let template = {
        Resources: {
            MyTable: {
                Type: 'AWS::DynamoDB::Table',
                'x-audit': true
            }
        },
        Outputs: {
            MyTableStream: {
                Value: streamArn('MyTable')
            }
        }
    };
    let result = sut(template);
    t.deepEquals(
        R.path(['Parameters', 'MyTableStream'], result),
        { Description: 'The ARN of the DynamoDB stream of MyTable', Type: 'String' },
        'There should be a parameter to take the DynamoDB stream of the table being audited');
    t.deepEqual(
        R.path(['Resources', 'MyTable-AuditTrigger', 'Properties', 'EventSourceArn'], result),
        { Ref: 'MyTableStream' },
        'There should be an audit trigger with event source ARN referencing the parameter');
    t.end();
});

test('audit: An audit trigger is not created for a stack output if it does not have audit enabled', (t) => {
    let template = {
        Resources: {
            MyTable: {
                Type: 'AWS::DynamoDB::Table'
            }
        },
        Outputs: {
            MyTableStream: {
                Value: streamArn('MyTable')
            }
        }
    };
    let result = sut(template);
    t.notOk(
        R.pipe(R.path(['Parameters']), R.has('MyTableStream'))(result),
        'There should not be a parameter to take the DynamoDB stream of the table not being audited');
    t.notOk(
        R.pipe(R.path(['Resources']), R.has('MyTable-AuditTrigger'))(result),
        'There should not be an audit trigger');
    t.end();
});

test('audit: An audit trigger is not created for a stack output if it is not a DynamoDB stream', (t) => {
    let template = {
        Resources: {
            MyTable: {
                Type: 'AWS::DynamoDB::Table'
            }
        },
        Outputs: {
            MyTableStream: {
                Value: ref('MyTable')
            }
        }
    };
    let result = sut(template);
    t.notOk(
        R.pipe(R.path(['Parameters']), R.has('MyTableStream'))(result),
        'There should not be a parameter to take the DynamoDB stream of the table not being audited');
    t.notOk(
        R.pipe(R.path(['Resources']), R.has('MyTable-AuditTrigger'))(result),
        'There should not be an audit trigger');
    t.end();
});