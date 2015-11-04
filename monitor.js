'use strict';

var _ = require('lodash');
var express = require('express');
var Promise = require('bluebird');
var VError = require('verror');
var rest = require('restler');
var config = require('./config.json');
var email = require('./email.js');

var app = express();

function log(s) {
  var msg = [
    new Date().toISOString(),
    s
  ].join(': ');
  console.log(msg);
}

app.get('/status/', function(req, res, next) {
  var data = {status: 'OK'};
  res.json(data);
  log('RESPONSE: ' + JSON.stringify(data));
});

var startupDelay = config.monitor.startupDelay * 1000 || 60 * 1000;
var interval = config.monitor.interval * 1000 || 30 * 60 * 1000;

Promise.fromNode(function(cb) {
  app.listen(config.monitor.port, cb);
})
.then(function() {
  log('listening on port: ' + config.monitor.port);
})
.delay(startupDelay)
.then(function() {
  if (config.monitor.targets.length === 0) {
    throw new Error('No targets specified.');
  }
})
.then(function() {
  var rec = function() {
    return Promise.map(config.monitor.targets, function(target) {
      return Promise.fromNode(function(cb) {
        rest.get(target)
        .on('success', function(data) {
          cb(null, data);
        })
        .on('fail', function(data, resp) {
          cb(new Error([data, resp].join(':')));
        })
        .on('error', function(err) {
          cb(err);
        });
      })
      .timeout(10 * 1000)
      .then(function(data) {
        log('OK: ' + target + ' --> ' + JSON.stringify(data));
      })
      .catch(function(err) {
        var err2 = new VError(err, 'Failed status check of target: ' + target);
        log('ERROR: ' + JSON.stringify(err2));
        var subject = 'Status Check Failure: ' + target;
        var text = JSON.stringify(err2, null, '  ');
        return email.send(subject, text);
      });
    })
    .delay(interval)
    .then(function() {
      return rec();
    });
  };
  return rec();
});
