#!/usr/bin/env node

'use strict';

var _ = require('lodash');
var rest = require('restler');
var Promise = require('bluebird');
var shared = require('./shared.js');
var urls = require('url');
var util = require('util');
var VError = require('verror');

// @todo: @bcauldwell - Needs to point to the production instance.
// @todo: @bcauldwell - Should probably be https, and there should
// be some barebones security.
/*
 * Default target.
 */:
var DEFAULT_TARGET = {
  protocol: 'http',
  hostname: '127.0.0.1',
  port: '3030'
};

/*
 * Constructor.
 */
function Client(id, address) {

  // @todo: @bcauldwell - Do some argument processing here.

  // The id argument is optional.
  this.id = id;

  // The address argument is also optional.
  if (address) {
    this.target = url.parse(address);
  } else {
    // Grab the default target that points to the production instance.
    this.target = DEFAULT_TARGET;
  }

};

/*
 * Send and handle a REST request.
 */
Client.prototype.__request = function(verb, pathname, data) {

  // Save for later.
  var self = this;

  // Build url.
  return Promise.try(function() {
    var obj = _.extend({pathname: pathname}, self.target);
    return urls.format(obj);
  })
  .then(function(url) {

    // Send REST request.
    return new Promise(function(fulfill, reject) {
      rest[verb](url, data)
      .on('success', fulfill)
      .on('fail', reject)
      .on('error', reject);
    })
    // Give request a 10 second timeout.
    .timeout(10 * 1000)
    // Wrap errors for more information.
    .catch(function(err) {
      throw new VError(err,
        'Error during REST request. url=%s, data=%s.',
        [verb, url].join(':'),
        data
      );
    });

  });


};

/*
 * Get full list of all metrics records.
 */
Client.prototype.getAll = function() {

  return this.__request('get', 'metrics/v1/');

};

/*
 * Create a new metric record and return it's ID.
 */
Client.prototype.create = function() {

  // Send REST request.
  return this.__request('post', 'metrics/v1/')
  // Validate response and return ID.
  .then(function(data) {
    if (!data || !data.id) {
      throw new Error('Invalid create response: ' + shared.pp(data));
    } else {
      return data.id;
    }
  });

};

/*
 * Return the metric record's ID, or create one if it doesn't have one. 
 */
Client.prototype.__getId = function() {
  
  var self = this;

  if (self.id) {
    // ID is already set, just return it.
    return Promise.resolve(self.id);
  } else {
    // No metic record exists, so create one.
    return self.create()
    .tap(function(id) {
      self.id = id;
    });
  }

};

/*
 * Get the current metric record to this instance.
 */
Client.prototype.get = function() {

  var self = this;

  // Get ID.
  return self.__getId()
  // Send REST request.
  .then(function(id) {
    return self.__request('get', 'metrics/v1/' + id);
  });

};

/*
 * Report meta data for this metric client instance.
 */
Client.prototype.report = function(metaData) {

  // Save for later.
  var self = this;

  // Build request data.
  var record = {
    created: shared.ts(),
    data: metaData
  };

  // Get this metric client's ID.
  return self.__getId()
  // Send REST request.
  .then(function(id) {
    return self.__request('putJson', 'metrics/v1/' + id, record);
  });

};

// Return constructor as the module object.
module.exports = Client;
