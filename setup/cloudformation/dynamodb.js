'use strict';

let { getAtt, sub } = require('./template');

let streamArn = getAtt.bind(null, 'StreamArn');

function table({ name, keys, capacity = [10, 5], indices = [] }) {

    function attributeDefinitions(attributeSets) {
        let kset = new Set(attributeSets.map(Object.keys).reduce((acc, nxt) => [...nxt, ...acc], []));
        return Array.from(kset).sort().reduce((defs, AttributeName) => {
            let AttributeType = attributeSets.reduce((existingType, attributes) => {
                let type = attributes[AttributeName];
                if (type !== undefined) {
                    if (existingType === undefined) {
                        return type;
                    } else if (type !== existingType) {
                        throw new Error(`Inconsistent attribute definition. ${AttributeName}`)
                    }
                }
                return existingType;
            }, undefined);
            return [...defs, { AttributeName, AttributeType }];
        }, []);
    }

    function keySchema(attributeSet) {
        let [head, ...tail] = Object.keys(attributeSet);
        return [
            { AttributeName: head, KeyType: 'HASH' },
            ...tail.map(AttributeName => ({ AttributeName, KeyType: 'RANGE' }))
        ];
    }

    function globalSecondaryIndexes(indexes) {
        function globalSecondaryIndex({ keys, capacity = [10, 5] }) {
            let [ReadCapacityUnits, WriteCapacityUnits] = capacity;
            return {
                IndexName: [...Object.keys(keys), 'index'].join('-'),
                KeySchema: keySchema(keys),
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits,
                    WriteCapacityUnits
                },
            }
        }
        return indexes.length > 0
            ? { GlobalSecondaryIndexes: indexes.map(globalSecondaryIndex) }
            : {}
    }

    function tableName(logicalName) {
        return logicalName
            ? { TableName: sub(`\${pResourcePrefix}${logicalName}`) }
            : {}
    }

    return (() => {
        let [ReadCapacityUnits, WriteCapacityUnits] = capacity;
        return {
            Type: "AWS::DynamoDB::Table",
            Properties: Object.assign(
                {
                    AttributeDefinitions: attributeDefinitions([keys, ...indices.map(x => x.keys)]),
                    KeySchema: keySchema(keys),
                    ProvisionedThroughput: {
                        ReadCapacityUnits,
                        WriteCapacityUnits
                    },
                    StreamSpecification: {
                        StreamViewType: "NEW_AND_OLD_IMAGES"
                    },
                },
                tableName(name),
                globalSecondaryIndexes(indices)
            )
        }
    })();
}


module.exports = {
    streamArn,
    table
}