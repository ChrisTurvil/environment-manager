'use strict';

const test = require('tape');
const { table: sut } = require('./dynamodb');

const integrationTestExpectedResult = {
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

test('dynamoTable: integration test', (t) => {
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
    t.deepEqual(sut(spec), integrationTestExpectedResult);
    t.end();
});

test('dynamoTable: the table does not have a name if a name is not specified', (t) => {
    let spec = {
        keys: { Whatever: 'S' },
    }
    t.notOk(Object.hasOwnProperty.call(sut(spec).Properties, 'TableName'));
    t.end();
});

test('dynamoTable: the table has a name if a name is specified', (t) => {
    let spec = {
        keys: { Whatever: 'S' },
        name: 'Eric'
    }
    t.deepEqual(sut(spec).Properties.TableName, { 'Fn::Sub': '${pResourcePrefix}Eric' });
    t.end();
});

test('dynamoTable: the key schema uses the first key as the HASH', (t) => {
    let spec = {
        keys: { Z: 'S', A: 'S' },
    }
    t.deepEqual(sut(spec).Properties.KeySchema, [
        { AttributeName: 'Z', KeyType: 'HASH' },
        { AttributeName: 'A', KeyType: 'RANGE' }
    ]);
    t.end();
});

test('dynamoTable: the attribute definitions are the union of the table and index keys', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { keys: { A: 'S', C: 'N' } },
            { keys: { D: 'S', C: 'N' } }
        ]
    };
    t.deepEqual(sut(spec).Properties.AttributeDefinitions, [
        { AttributeName: 'A', AttributeType: 'S' },
        { AttributeName: 'B', AttributeType: 'N' },
        { AttributeName: 'C', AttributeType: 'N' },
        { AttributeName: 'D', AttributeType: 'S' }
    ]);
    t.end();
});

test('dynamoTable: the table has no secondary indexes if none are specified', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' }
    };
    t.notOk(Object.hasOwnProperty.call(sut(spec).Properties, 'GlobalSecondaryIndexes'));
    t.end();
});

test('dynamoTable: the table has the secondary indexes specified', (t) => {
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { capacity: [1, 2], keys: { A: 'S', C: 'N' } },
            { capacity: [3, 4], keys: { D: 'S', C: 'N' } }
        ]
    };
    t.deepEqual(sut(spec).Properties.GlobalSecondaryIndexes, [
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

test('dynamoTable: the read and write capacity get default values if unspecified', (t) => {
    let expectedDefaults = { ReadCapacityUnits: 10, WriteCapacityUnits: 5 }
    let spec = {
        keys: { A: 'S', B: 'N' },
        indices: [
            { keys: { A: 'S', C: 'N' } }
        ]
    };
    let result = sut(spec);
    t.deepEqual(result.Properties.ProvisionedThroughput, expectedDefaults, 'table throughput');
    t.deepEqual(result.Properties.GlobalSecondaryIndexes[0].ProvisionedThroughput, expectedDefaults, 'index throughput');
    t.end();
});