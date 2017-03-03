var AwsAccount  = require('./AwsAccount'),
    DynamoTable = require('./DynamoTable');

var Convert = {
  objectToJsonString: function(object) {
    var result = JSON.stringify(object, null, '  ');
    return result;
  },
  jsonStringToObject: function(jsonString) {
    var result = JSON.parse(jsonString);
    return result;
  }
};

var Stringify = {
  defaultDynamoTableContent: function(content) {
    var result = content.map(Convert.objectToJsonString)
                        .join(',\n');

    return result;
  },
  lbUpstreamDynamoTableContent: function(content) {
    var normalizeValue = function(item) {
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

var tables = awsAccountNumber => [
  new DynamoTable('InfraChangeAudit', new AwsAccount('prod', awsAccountNumber), Stringify.defaultDynamoTableContent),
];

module.exports = tables;
