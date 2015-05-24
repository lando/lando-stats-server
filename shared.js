'use strict';

/*
 * Return a formatted string (aka pretty print).
 */
exports.pp = function(obj) {
  return JSON.stringify(obj, null, '  ');
};

/*
 * Return current time in JSON format.
 */
exports.ts = function() {
  return new Date().toJSON();
};
