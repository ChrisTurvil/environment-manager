'use strict';

var AwsAccount = require('./AwsAccount');
var DynamoTable = require('./DynamoTable');

var Convert = {
  objectToJsonString: function (object) {
    var result = JSON.stringify(object, null, '  ');
    return result;
  },
  jsonStringToObject: function (jsonString) {
    var result = JSON.parse(jsonString);
    return result;
  }
};

var Stringify = {
  defaultDynamoTableContent: function (content) {
    var result = content.map(Convert.objectToJsonString)
      .join(',\n');

    return result;
  },
  lbUpstreamDynamoTableContent: function (content) {
    var normalizeValue = function (item) {
      item.Value = Convert.jsonStringToObject(item.value);
      delete item.value;

      return item;
    };

    var result = content.map(normalizeValue)
      .map(Convert.objectToJsonString)
      .join(',\n');

    return result;
  }
};

let stringifierFor = tableName =>
  /ConfigLBUpstream$/i.test(tableName)
    ? Stringify.lbUpstreamDynamoTableContent
    : Stringify.defaultDynamoTableContent;

function crossProduct(accounts, tables) {
  return accounts.map(account => tables.map(table => new DynamoTable(table, new AwsAccount(account.name, account.number), stringifierFor(table))))
    .reduce((acc, nxt) => acc.concat(nxt), []);
}

var tables = (opts) => {
  let prodTables = crossProduct([opts.masterAccount], opts.masterTables);
  let childTables = crossProduct(opts.childAccounts, opts.childTables);
  return prodTables.concat(childTables);
};

module.exports = tables;
