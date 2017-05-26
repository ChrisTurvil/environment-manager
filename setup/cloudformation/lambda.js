'use strict';

function trigger(functionName, eventSource) {
    return {
        Type: 'AWS::Lambda::EventSourceMapping',
        Properties: {
            BatchSize: 25,
            Enabled: true,
            EventSourceArn: eventSource,
            FunctionName: {
                Ref: functionName
            },
            StartingPosition: 'LATEST'
        }
    }
}

module.exports = {
    trigger
}