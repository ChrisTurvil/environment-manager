'use strict';

const test = require('tape');
const { trigger } = require('./lambda');

test('lambda trigger: returns an event source mapping', (t) => {
    let expected = {
        Type: 'AWS::Lambda::EventSourceMapping',
        Properties: {
            BatchSize: 25,
            Enabled: true,
            EventSourceArn: 'arn:aws:dynamodb:eu-west-1:123456789012:table/MyTable',
            FunctionName: {
                Ref: 'MyFunction'
            },
            StartingPosition: 'LATEST'
        }
    };
    let result = trigger('MyFunction', 'arn:aws:dynamodb:eu-west-1:123456789012:table/MyTable');
    t.deepEqual(result, expected);
    t.end();
});
