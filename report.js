'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var email = require('./email.js');
var moment = require('moment');
var classifier = require('./classifier.js')();
var JSONStream = require('JSONStream');
var ps = require('promise-streams');
var yargs = require('yargs');

var argv = yargs.argv;
var reportLength = argv.d || 30;
var endDate = moment();
var startDate = moment(endDate).subtract(reportLength - 1, 'days');

/*
 * Returns a list of dates between start and end dates.
 */
function datesBetween(start, end) {
  // Recursive function.
  var rec = function(cursor, dates) {
    // Add cursor date to list of dates.
    dates.push(cursor);
    if (cursor.isSame(end)) {
      // We have reached the last date.
      return dates;
    } else {
      // Move to next date.
      cursor = moment(cursor).add(1, 'days');
      return rec(cursor, dates);
    }
  };
  // Init recursive function.
  return rec(start, []);
}

/*
 * State object.
 */
var state = {
  startDate: startDate.format('YYYY-MM-DD'),
  endDate: endDate.format('YYYY-MM-DD'),
  dates: {}
};

// Add list of dates to state.
_.each(datesBetween(startDate, endDate), function(date) {
  var key = date.format('YYYY-MM-DD');
  state.dates[key] = {};
})

// Stream stdin.
process.stdin
// Transform to json objects.
.pipe(JSONStream.parse('records.*'))
// Map meta data records each to a new data record.
.pipe(ps.map(function(data) {
  /*
   * {metaData: [a, b]} => [{metaData: a}, {metaData: b}]
   */
  var blueprint = _.cloneDeep(data);
  blueprint.metaData = null;
  return Promise.map(data.metaData, function(metaData) {
    var clone = _.cloneDeep(blueprint);
    clone.metaData = _.cloneDeep(metaData);
    return clone;
  });
}))
// Filter out data based on date of activity.
.map(function(datas) {
  return Promise.filter(datas, function(data) {
    var ts = moment(data.metaData.created);
    return ts.isBetween(startDate, endDate);
  });
})
// Use the data to build a report.
.map(function(datas) {
  return Promise.each(datas, function(data) {
    var action = data.metaData.data.action;
    var keyDate = moment(data.metaData.created).format('YYYY-MM-DD');
    var keyId = data._id;
    if (_.contains(['start', 'stop'], action)) {
      // Add activity to state.
      state.dates[keyDate][keyId] = true;
    } else if (action === 'error') {
      // Classify all error actions.
      if (!data.metaData.data.message) {
        //throw new Error(JSON.stringify(data, null, '  '));
      } else {
        classifier.classify(data.metaData.data.message);
      }
    }
  });
})
// Wait for end of stream.
.wait()
// Post process state, and report.
.then(function() {
  // Init report object.
  var report = {
    startDate: state.startDate,
    endDate: state.endDate
  };
  // Report active users.
  report.activeUsersByDate = _.mapValues(state.dates, function(o, date) {
    return _.keys(o).length;
  });
  // Report error groups.
  report.errors = _.map(classifier.groups, function(group) {
    group.count = group.samples.length;
    group.samples = _.uniq(group.samples);
    group.samples = _.slice(group.samples, 0, 10);
    return group;
  });
  // Output report either to stdout or email.
  var reportString = JSON.stringify(report, null, '  ');
  if (argv.email) {
    // @todo: Output to a file, and attach file to email.
    email.send('Kalabox Stats Report', reportString);
  } else {
    console.log(reportString);
  }
});
