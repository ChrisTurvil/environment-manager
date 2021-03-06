function pad(number) {
  return number < 10 ? '0' + number : number;
};

function getDatestamp(date) {
  var result = [
        date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join('');

  return result;
}

function getDynamoTableBackupFilename(dynamoTable, bucketPath) {
  var datestamp = getDatestamp(new Date());

  var filename = [
    datestamp,
    'environmentmanager',
    dynamoTable.name,
    dynamoTable.account.name
  ].join('_') + '.json';

  var result = [
    bucketPath,
    filename
  ].join('/');

  return result;
};

function DynamoTable(name, account, stringifier, bucketPath) {
  var $this = this;

  $this.name      = name;
  $this.account   = account;
  $this.stringify = stringifier;

  $this.toString = function() {
    return [$this.account.name, $this.name].join('/');
  };

  $this.toBackupFilename = function() {
    return getDynamoTableBackupFilename($this, bucketPath);
  };

}

module.exports = DynamoTable;
