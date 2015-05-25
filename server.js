'use strict';

var _ = require('lodash');
var bodyParser = require('body-parser');
var express = require('express');
var metricsDb = require('./metricsDb.js');
var Promise = require('bluebird');
var uuid = require('uuid');
var VError = require('verror');
var url = require('url');
var config = require('./config.json');
var shared = require('./shared.js');

// Create express app.
var app = express();

// Add a body parser, so we can parse post bodies.
app.use(bodyParser.json());

/*
 * Logging function.
 */
var log = function(msg) {
  console.log('HTTP: ' + msg);
};

/*
 * Take a promise and monitor it's completion.
 */
var monitorTask = function(prm, res) {
  
  // Wait for promise to finsish.
  return prm
  // Set a timeout.
  .timeout(4 * 1000)
  // Respond to request.
  .then(function(data) {
    log('response -> ' + shared.pp(data));
    res.json(data);  
  })
  // Handle errors with status code 500 and error message.
  .catch(function(err) {
    log('error -> ' + shared.pp(err));
    var data = {error: err.message};
    res.status(500).json(data);
  });

};

/*
 * Handle all incoming requests.
 */
app.get('/', function(req, res, next) {
  // @todo: @bcauldwell - Add logging.
  next();
});

/*
 * Handle getAll request.
 */
app.get('/metrics/v1/', function(req, res) {

  // Get all from db.
  var prm = metricsDb.getAll();
  monitorTask(metricsDb.getAll(), res);

});

/*
 * Handle get request.
 */
app.get('/metrics/v1/:id', function(req, res) {

  // Get record from db.
  var prm = metricsDb.get(req.params.id);
  monitorTask(prm, res);

});

/*
 * Handle create request.
 */
app.post('/metrics/v1/', function(req, res) {

  // Have db create a new record.
  var prm = metricsDb.create();
  monitorTask(prm, res);

});

/*
 * Handle append request.
 */
app.put('/metrics/v1/:id', function(req, res) {

  // ID param.
  var id = req.params.id;

  // Meta data from request body.
  var metaData = req.body;

  // Append meta data record to record.
  var prm = metricsDb.append(id, metaData);
  monitorTask(prm, res);

});

// Start listening.
// @todo: @bcauldwell - We need to change the port to something better.
var port = url.parse(config.web).port;
app.listen(port);
