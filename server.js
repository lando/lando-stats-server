'use strict';

var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var config = require('./config/');
var Db = require('./elastic.js');

/*
 * Create app.
 */
var app = express();

/*
 * Use json body parser plugin.
 */
app.use(bodyParser.json());

/*
 * Logging function.
 */
function log() {
  return console.log.apply(this, _.toArray(arguments));
}

/*
 * Pretty print function.
 */
function pp(obj) {
  return JSON.stringify(obj);
}

/*
 * Get a db connection, will dispose itself.
 */
function db() {
  // Use this ref for disposing.
  var instance = null;
  // Create db connection.
  return Promise.try(function() {
    instance = new Db(config.slot.database);
    return instance;
  })
  // Wrap errors.
  .catch(function(err) {
    throw new VError(
      err,
      'Error connecting to database: %s',
      pp(config.slot.database)
    );
  })
  // Make sure to close connection.
  .disposer(function() {
    if (instance) {
      instance.close();
    }
  });
};

/*
 * Helper function for mapping promise to response.
 */
function handle(fn) {
  // Returns a handler function.
  return function(req, res) {
    // Call fn in context of a promise.
    return Promise.try(fn, [req, res])
    // Make sure we have a timeout.
    .timeout(config.slot.timeout || 10 * 1000)
    // Handler failure.
    .catch(function(err) {
      console.log(err.message);
      console.log(err.stack);
      res.status(500);
      res.json({status: {err: 'Unexected server error.'}})
      res.end();
    })
    // Handle success.
    .then(function(data) {
      res.status(200);
      res.json(data);
      res.end();
    });
  };
}

/*
 * Respond to status pings.
 */
app.get('/status', handle(function(req, res) {
  return {status: 'OK'};
}));

/*
 * Post new meta data for metrics.
 */
app.post('/metrics/v2/:id', handle(function(req, res) {
  return Promise.using(db(), function(db) {
    return db.insert({
      instance: req.params.id,
      data: req.body
    });
  })
  .return({status: 'OK'});
}));

// Load config slot.
return config.load({
  slot: process.env['KALABOX_METRICS_REST_SLOT']
})
// Start listening.
.then(function() {
  var port = config.slot.server.port;
  return Promise.fromNode(function(cb) {
    app.listen(port, cb);
  })
  .then(function() {
    log('Listening on port: %s', port);
  });
});
