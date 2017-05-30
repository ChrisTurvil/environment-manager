'use strict';

const test = require('tape');
const {
    dependsOnSeq,
    follow,
    getAtt,
    getExtensions,
    ref,
    sub
} = require('./template');

test('template dependsOnSeq: returns its argument when it is empty', (t) => {
    let result = dependsOnSeq({});
    t.deepEqual(result, {});
    t.end();
});

test('template dependsOnSeq: returns its argument when it has one property', (t) => {
    let result = dependsOnSeq({ a: {} });
    t.deepEqual(result, { a: {} });
    t.end();
});

test('template dependsOnSeq: returns a sequence of dependencies when its argument has many properties', (t) => {
    let result = dependsOnSeq({ a: {}, b: {}, c: {} });
    t.deepEqual(result, { a: {}, b: { DependsOn: 'a' }, c: { DependsOn: 'b' } });
    t.end();
});

test('template getAtt', (t) => {
    t.deepEqual(getAtt('attribute', 'resource'), { 'Fn::GetAtt': ['resource', 'attribute'] });
    t.end();
});

test('template ref', (t) => {
    t.deepEqual(ref('resource'), { 'Ref': 'resource' });
    t.end();
});

test('template sub', (t) => {
    t.deepEqual(sub('expression'), { 'Fn::Sub': 'expression' });
    t.end();
});

test('template getExtensions', (t) => {
    let obj = {
        a: 'A',
        'x-a': true,
        'X-B': { schedule: 'daily' }
    };
    let result = getExtensions(obj);
    t.deepEqual(result, {
        'x-a': true,
        'X-B': { schedule: 'daily' }
    });
    t.end();
});

test('template follow: looks up a resource from a name', (t) => {
    let r = 'MyResource';
    let template = { Resources: { MyResource: { K: 'V' } } };
    let result = follow(r, template);
    t.deepEqual(result, ['MyResource', {K: 'V'}] );
    t.end();
});

test('template follow: looks up a resource from a Ref', (t) => {
    let r = { Ref: 'MyResource' };
    let template = { Resources: { MyResource: { K: 'V' } } };
    let result = follow(r, template);
    t.deepEqual(result, ['MyResource', {K: 'V'}] );
    t.end();
});

test('template follow: looks up a resource from a Fn::GetAtt', (t) => {
    let r = { 'Fn::GetAtt': ['MyResource', 'Arn'] };
    let template = { Resources: { MyResource: { K: 'V' } } };
    let result = follow(r, template);
    t.deepEqual(result, ['MyResource', {K: 'V'}] );
    t.end();
});

test('template follow: looks up a parameter from a name', (t) => {
    let r = 'MyResource';
    let template = { Parameters: { MyResource: { K: 'V' } } };
    let result = follow(r, template);
    t.deepEqual(result, ['MyResource', {K: 'V'}] );
    t.end();
});