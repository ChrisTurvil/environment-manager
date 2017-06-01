'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const R = require('ramda');
const audit = require('./audit.template');
const db = require('./db.template');
let { getAtt, ref } = require('./template');
let tablesData = require('./tables-data')();

function buildTemplate(tables) {
    let dbTemplate = db(tables);
    let auditTemplate = audit(dbTemplate);
    let stacks = {
        DbStack: {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
                Parameters: R.mapObjIndexed((v, k) => ref(k), dbTemplate.Parameters),
                TemplateURL: dbTemplate
            }
        },
        DbAuditStack: {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
                Parameters: R.mapObjIndexed((v, k) => dbTemplate.Outputs[k] ? getAtt(`Outputs.${k}`, 'DbStack') : ref(k), auditTemplate.Parameters),
                TemplateURL: auditTemplate
            }
        }
    }

    let rootTemplate = {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Environment Manager Resources",
        Parameters: {
            pAlertSNSTopic: {
                Type: "String",
                Description: "SNS Topic ARN for lambda alerts."
            }
        },
        Resources: stacks,
    };

    return rootTemplate;
}

function fileNameForResource(resourceName) {
    return `${resourceName}.json`;
}

let resourcesLens = R.lensProp('Resources');
let templateUrlLens = R.lensPath(['Properties', 'TemplateURL']);

function isStackWithInlineTemplate(resource) {
    let { Type = undefined } = resource;
    let templateUrl = R.view(templateUrlLens, resource);
    return Type === 'AWS::CloudFormation::Stack'
        && typeof templateUrl === 'object'
        && templateUrl !== null;
}

function generatedSubTemplates(template) {
    return R.pipe(
        R.view(resourcesLens),
        R.toPairs,
        R.filter(([, def]) => isStackWithInlineTemplate(def)),
        R.map(([k, def]) => [fileNameForResource(k), R.view(templateUrlLens, def)]),
        R.filter(([, v]) => typeof v === 'object' && v !== null)
    )(template);
}

function convertInlineTemplatesInStacksToRefs(template) {
    let updatedResources = R.pipe(
        R.view(resourcesLens),
        R.toPairs,
        R.filter(([, def]) => isStackWithInlineTemplate(def)),
        R.map(([k, v]) => [k, R.set(templateUrlLens, fileNameForResource(k), v)]),
        R.fromPairs
    )(template);

    return R.set(resourcesLens, R.merge(R.view(resourcesLens, template), updatedResources), template);
}

function main(tables) {
    let rootTemplate = buildTemplate(tables);
    Promise.map(
        [...generatedSubTemplates(rootTemplate), ['root.json', convertInlineTemplatesInStacksToRefs(rootTemplate)]],
        ([file, content]) => Promise.promisify(fs.writeFile)(path.resolve('dist', file), JSON.stringify(content, null, 2)));
}

module.exports = { buildTemplate, main };

if (require.main === module) {
    main(tablesData);
}
