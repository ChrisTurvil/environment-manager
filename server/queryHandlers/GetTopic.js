/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let snsTopicClient = require('modules/clientFactories/SNSTopicClient');

module.exports = function GetTopicQueryHandler(query) {
  return snsTopicClient(query.partition)
    .then(client => client.get({ topicName: query.topicName }));
};
