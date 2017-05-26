'use strict';

const test = require('tape');
const { streamArn, table } = require('./dynamodb');

test('dynamodb streamArn: returns a Fn::GetAtt intrinsic function call', (t) => {
    t.deepEqual(streamArn('logicalResourceName'), { 'Fn::GetAtt': ['logicalResourceName', 'StreamArn'] })
    t.end();
})

test('dynamodb table: integration test', (t) => {
    const dxpectedResult = {
        "Type": "AWS::DynamoDB::Table",
        "Properties": {
            "AttributeDefinitions": [
                {
                    "AttributeName": "Age",
                    "AttributeType": "N"
                },
                {
                    "AttributeName": "FirstName",
                    "AttributeType": "S",
                },
                {
                    "AttributeName": "SecondName",
                    "AttributeType": "S"
                }
            ],
            "GlobalSecondaryIndexes": [
                {
                    "IndexName": 'FirstName-Age-index',
                    "KeySchema": [
                        {
                            "AttributeName": "FirstName",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "Age",
                            "KeyType": "RANGE"
                        }
                    ],
                    "Projection": {
                        "ProjectionType": "ALL"
                    },
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 3,
                        "WriteCapacityUnits": 4
                    }
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "FirstName",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "SecondName",
                    "KeyType": "RANGE"
                }
            ],
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 1,
                "WriteCapacityUnits": 2
            },
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "TableName": { 'Fn::Sub': "${pResourcePrefix}People" }
        }
    };

    let spec = {
        name: 'People',
        keys: { FirstName: 'S', SecondName: 'S' },
        capacity: [1, 2],
        indices: [
            {
                keys: { FirstName: 'S', Age: 'N' },
                capacity: [3, 4]
            }
        ]
    }
    t.deepEqual(table(spec), dxpectedResult);
    t.end();
});

test('dynamodb table: the table does not have a name if a name is not specified', (t) => {
    let spec = {
        keys: { Whatever: 'S' },
    }
    t.notOk(Object.hasOwnProperty.call(table(spec).Properties, 'TableName'));
    t.end();
});

test('dynamodb table: the table has a name if a name is specified', (t) => {
    let spec = {
        keys: { Whatever: 'S' },
        name: 'Eric'
    }
    t.deepEqual(table(spec).Properties.TableName, { 'Fn::Sub': '${pResourcePrefix}Eric' });
    t.end();
});

test('dynamodb table: the key schema uses the first key as the HASH', (t) => {
    let spec = {
        keys: { Z: 'S', A: 'S' },
    }
    t.deepEqual(table(spec).Properties.KeySchema, [
        { AttributeName: 'Z', KeyType: 'HASH' },
        { AttributeName: 'A', KeyType: 'RANGE' }
    ]);
    t.end();
});

test('dynamodb table: the attribute definitions are the union of the table and index keys', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { keys: { A: 'S', C: 'N' } },
            { keys: { D: 'S', C: 'N' } }
        ]
    };
    t.deepEqual(table(spec).Properties.AttributeDefinitions, [
        { AttributeName: 'A', AttributeType: 'S' },
        { AttributeName: 'B', AttributeType: 'N' },
        { AttributeName: 'C', AttributeType: 'N' },
        { AttributeName: 'D', AttributeType: 'S' }
    ]);
    t.end();
});

test('dynamodb table: the table has no secondary indexes if none are specified', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' }
    };
    t.notOk(Object.hasOwnProperty.call(table(spec).Properties, 'GlobalSecondaryIndexes'));
    t.end();
});

test('dynamodb table: the table has the secondary indexes specified', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { capacity: [1, 2], keys: { A: 'S', C: 'N' } },
            { capacity: [3, 4], keys: { D: 'S', C: 'N' } }
        ]
    };
    t.deepEqual(table(spec).Properties.GlobalSecondaryIndexes, [
        {
            "IndexName": 'A-C-index',
            "KeySchema": [
                {
                    "AttributeName": "A",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "C",
                    "KeyType": "RANGE"
                }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 1,
                "WriteCapacityUnits": 2
            }
        },
        {
            "IndexName": 'D-C-index',
            "KeySchema": [
                {
                    "AttributeName": "D",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "C",
                    "KeyType": "RANGE"
                }
            ],
            "Projection": {
                "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 3,
                "WriteCapacityUnits": 4
            }
        }
    ]);
    t.end();
});

test('dynamodb table: the read and write capacity get default values if unspecified', (t) => {
    let expectedDefaults = { ReadCapacityUnits: 10, WriteCapacityUnits: 5 }
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { keys: { A: 'S', C: 'N' } }
        ]
    };
    let result = table(spec);
    t.deepEqual(result.Properties.ProvisionedThroughput, expectedDefaults, 'table throughput');
    t.deepEqual(result.Properties.GlobalSecondaryIndexes[0].ProvisionedThroughput, expectedDefaults, 'index throughput');
    t.end();
});

test('dynamodb table: custom properties are copied to the table definition', (t) => {
    let spec = {
        keys: { A: 'S' },
        'x-audit': true,
        'X-BACKUP': { schedule: 'daily' }
    };
    let result = table(spec);
    t.deepEqual(result['x-audit'], spec['x-audit']);
    t.deepEqual(result['X-BACKUP'], spec['X-BACKUP']);
    t.end();
});