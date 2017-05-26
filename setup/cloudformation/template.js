'use strict';

const R = require('ramda');

function getAtt(attribute, object) {
    return { 'Fn::GetAtt': [object, attribute] };
}

function ref(name) {
    return { Ref: name };
}

function sub(str) {
    return { 'Fn::Sub': str };
}

function dependsOnSeq(resources) {
    function addDependencies(acc, key) {
        let [[prev,],] = acc;
        return [
            [key, Object.assign({ DependsOn: prev }, resources[key])],
            ...acc
        ];
    }
    function pairsToObject(acc, [key, value]) {
        acc[key] = value;
        return acc;
    }
    let [head, ...tail] = Object.keys(resources);
    if (head) {
        return tail
            .reduce(addDependencies, [[head, resources[head]]])
            .reverse()
            .reduce(pairsToObject, {});
    } else {
        return {};
    }
}

let isExtensionProperty = (v, k) => /^x-/i.test(k)

let getExtensions = R.pickBy(isExtensionProperty);

let removeExtensions = R.pickBy(R.complement(isExtensionProperty));

module.exports = {
    dependsOnSeq,
    getAtt,
    getExtensions,
    ref,
    removeExtensions,
    sub,
}