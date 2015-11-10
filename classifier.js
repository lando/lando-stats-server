'use strict';

var strsim = require('string-similarity').compareTwoStrings;
var _ = require('lodash');

/*
 * String classifier.
 */
function Classifier(threshold) {

  // Init empty group array.
  this.groups = [];
  // Set threshold, or use default threshold.
  this.threshold = threshold || 0.6;

}

/*
 * Classify a string.
 */ 
Classifier.prototype.classify = function(s, id) {

  // Make sure it's a string we are classifying.
  if (typeof s !== 'string') {
    throw new Error('Cannot classify a non-string: ' + s);
  }

  var self = this;
  
  // Find an existing group this string matches closely enough.
  var group = _.reduce(self.groups, function(acc, group) {
    if (acc) {
      return acc;
    } else if (strsim(group.prototype, s) > self.threshold) {
      return group;
    }
  }, undefined);

  if (group) {
    // @todo: Really a merge of samples should happen here.
    // Existing group found, merge sample with existing group.
    group.samples.push(s);
    group.ids.push(id);
  } else {
    // No existing group found, so create one.
    self.groups.push({
      prototype: s,
      samples: [s],
      ids: [id]
    });
  }

};

/*
 * Return a new classifier instance.
 */
module.exports = function() {
  return new Classifier();
};
