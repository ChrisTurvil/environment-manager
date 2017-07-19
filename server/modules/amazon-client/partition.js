'use strict';

function account({ roleArn }) {
  return roleArn.split(':')[4];
}

module.exports = {
  account
};
