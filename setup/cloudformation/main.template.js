'use strict';

const audit = require('./audit.template');
const db = require('./db.template');

function buildTemplate() {
        return {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Environment Manager Resources",
        Parameters: {
            pAlertSNSTopic: {
                Type: "String",
                Description: "SNS Topic ARN for lambda alerts."
            }
        },
        Resources: ,
    }
}

function main() {

}