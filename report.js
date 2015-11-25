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
  dates: {},
  uniqueIds: {},
  version: {},
  osInfo: {}
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
// Filter out records without meta data.
.pipe(ps.filter(function(data) {
  return !!data.metaData;
}))
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
    return ts.isBetween(
      startDate.startOf('day'),
      endDate.endOf('day')
    );
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
      // Add unique id data.
      if (!state.uniqueIds[keyId]) {
        state.uniqueIds[keyId] = 0;
      }
      state.uniqueIds[keyId] += 1;
      // Add os info to state.
      var os = data.metaData.data.os;
      if (!state.osInfo[os.type]) {
        state.osInfo[os.type] = {};
      }
      if (!state.osInfo[os.type][os.platform]) {
        state.osInfo[os.type][os.platform] = {};
      }
      if (!state.osInfo[os.type][os.platform][os.release]) {
        state.osInfo[os.type][os.platform][os.release] = 0;
      }
      state.osInfo[os.type][os.platform][os.release] += 1;
      // Add kbox version info to state.
      var version = data.metaData.data.version.split('.');
      var major = version[0];
      var minor = version[1];
      var patch = version[2];
      if (!state.version[major]) {
        state.version[major] = {};
      }
      if (!state.version[major][minor]) {
        state.version[major][minor] = {};
      }
      if (!state.version[major][minor][patch]) {
        state.version[major][minor][patch] = 0;
      }
      state.version[major][minor][patch] += 1;
    } else if (action === 'error') {
      // Classify all error actions.
      if (!data.metaData.data.message) {
        //throw new Error(JSON.stringify(data, null, '  '));
      } else {
        classifier.classify(data.metaData.data.message, keyId);
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
  // Report unique users.
  report.uniqueUsers = _.keys(state.uniqueIds).length;
  // Report active users.
  report.activeUsersByDate = _.mapValues(state.dates, function(o, date) {
    return _.keys(o).length;
  });
  // Report version info.
  report.version = state.version;
  // Report os info.
  report.osInfo = state.osInfo;
  // Report error groups.
  report.errors = _.map(classifier.groups, function(group) {
    group.count = group.samples.length;
    group.samples = _.uniq(group.samples);
    group.samples = _.slice(group.samples, 0, 10);
    group.ids = _.uniq(group.ids);
    group.idCount = group.ids.length;
    delete group.ids;
    return group;
  });
  report.errors = _.sortBy(report.errors, function(group) {
    return group.count;
  });
  report.errors.reverse();
  // Output report either to stdout or email.
  var reportString = JSON.stringify(report, null, '  ');
  if (argv.email) {
    // @todo: Output to a file, and attach file to email.
    email.send('Kalabox Stats Report', reportString);
  } else {
    console.log(reportString);
  }
});
