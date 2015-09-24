'use strict';

var Promise = require('bluebird');
var Client = require('./client.js');
var argv = require('yargs').argv;
var config = require('./config.json');

var url = argv._[0] || config.web;

var username = argv.u.split(':')[0];
var password = argv.u.split(':')[1];

var client = new Client(null, url);

client.getAll(username, password)
.then(function(result) {
  return result.ids;
})
.then(function(ids) {
  console.log('{"records":[');
  var count = 0;
  return Promise.each(ids, function(id) {
    if (count > 0) {
      console.log(',');
    }
    count += 1;
    return client.getOne(id, username, password)
    .then(function(data) {
      console.log(JSON.stringify(data[0]));
    });
  })
  .then(function() {
    console.log(']}');
  });
});
