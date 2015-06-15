'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var shared = require('./shared.js');
var VError = require('verror');
var uuid = require('uuid');
var Db = require('./mongoAdapter.js');
var config = require('./config.json');

/*
 * Singleton database instance.
 */
var db = _.once(function() {
  return new Db(config.db);
});

/*
 * Take a task promise and a name for that task and monitor it's completion.
 */
var monitorTask = function(prm, taskName) {

  // Wait for task promise to finish.
  return prm
  // Set a timeout for the task promise.
  .timeout(3 * 1000)
  // Wrap errors.
  .catch(function(err) {
    throw new VError(err, 'Error while running task: ' + taskName);
  });

};

// @todo: @bcauldwell - getAll and get should be protected by an admin
// password and have a slightly different path.

/*
 * Return the entire db.
 */
var getAll = function(iterator) {

  var prm = db().getAll(iterator);
  return monitorTask(prm, 'getAll');

};

/*
 * Return a single record of the db.
 */
var get = function(id) {

  // Get record from db.
  var prm = db().get(id);
  return monitorTask(prm, 'get');

};

/*
 * Create a new db record and return it.
 */
var create = function() {

  var prm = db().create()
  .then(function(data) {
    return {id: data.insertedId};
  });
  return monitorTask(prm, 'create');

};

/*
 * Add a meta data record to a db record.
 */
var append = function(id, metaData) {

  var prm = db().append(id, metaData);
  return monitorTask(prm, 'append');

};

// Build module API.
module.exports = {
  get: get,
  getAll: getAll,
  create: create,
  append: append
};
