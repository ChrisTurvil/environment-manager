'use strict';

const R = require('ramda');

let str = x => JSON.stringify(x, null);

function follow(r, template) {
    if (typeof r === 'string') {
        let matches = R.pipe(
            R.map(path => R.path(path, template)),
            R.filter(x => x !== undefined)
            )([['Parameters', r], ['Resources', r]]);
        if (matches.length === 1) {
            return [r, matches[0]];
        } else if (matches.length > 1) {
            throw new Error(`Ambiguous reference: ${str(r)}`);
        } else {
            return null;
        }
    } else if (typeof r === 'object') {
        let matches = R.pipe(
            R.map(path => R.path(path, r)),
            R.filter(x => typeof x === 'string')
        )([['Ref'], ['Fn::GetAtt', 0]]);
        if (matches.length === 1) {
            return follow(matches[0], template);
        } else {
            throw new Error(`Invalid reference: ${str(r)}`)
        }
    }
    else {
        throw new Error(`Invalid reference: ${str(r)}`)
    }
}

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
    follow,
    getAtt,
    getExtensions,
    ref,
    removeExtensions,
    sub,
}