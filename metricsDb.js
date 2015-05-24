'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var shared = require('./shared.js');
var VError = require('verror');
var uuid = require('uuid');

/*
 * Singleton database instance.
 */
var db = {};

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
var getAll = function() {

  var prm = Promise.resolve(db);
  return monitorTask(prm, 'getAll');

};

/*
 * Return a single record of the db.
 */
var get = function(id) {

  // Get record from db.
  var prm = Promise.try(function() {
    // Get record.
    var record = db[id];
    // If record doesn't exist, throw an error.
    if (!record) {
      throw new Error('ID does not exist: ' + id); 
    }
    // Return record.
    return record;
  });

  return monitorTask(prm, 'get');

};

/*
 * Create a new db record and return it.
 */
var create = function() {

  var prm = Promise.try(function() {
    // Create a new UUID.
    var id = uuid.v4();
    // Create new record.
    var record = {
      id: id,
      created: shared.ts()
    };
    // Validate ID doesn't already exist.
    if (db[id]) {
      throw new Error('ID already exists: ' + id);
    }
    // Add record to db.
    db[id] = record;
    // Return record.
    return record;
  });

  return monitorTask(prm, 'create');

};

/*
 * Add a meta data record to a db record. 
 */
var append = function(id, metaData) {
  
  // Get existing record.
  var prm = get(id)
  .then(function(obj) {
    // Make sure meta data array exists.
    if(!obj.metaData) {
      obj.metaData = [];
    }
    // Validate.
    if (!metaData) {
      throw new Error('Invalid metaData: ' + share.pp(metaData));
    } else if (!metaData.created) {
      throw new Error('Invalid metaData.created: ' + share.pp(metaData));
    } else if (!metaData.data) {
      throw new Error('Invalid metaData.data: ' + share.pp(metaData));
    }
    // Make meta data record.
    var record = {
      created: metaData.created,
      recorded: shared.ts(),
      data: metaData.data
    };
    // Add meta data record to db record.
    obj.metaData.push(record);
  });

  return monitorTask(prm, 'append');

};

// Build module API.
module.exports = {
  get: get,
  getAll: getAll,
  create: create,
  append: append
};
