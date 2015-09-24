'use strict';

/*
 * Uses mailgun service to send emails.
 */

var Promise = require('bluebird');

// Authorization information.
var apiKey = 'key-d201d80adfc8fd45cfbdcf358e3abb75';
var domain = 'sandboxbc3a40148ee947fc962435ad9ca03156.mailgun.org';

/*
 * Create a new mailgun service instance using authorization info.
 */
var mailgun = require('mailgun-js')({
  apiKey: apiKey,
  domain: domain
});

/*
 * Sends an email with provided subject and text.
 */
function send(subject, text) {

  // @todo: add the ability to attach files.

  if (typeof text === 'object') {
    text = JSON.stringify(text, null, '  ');
  }

  var data = {
    from: 'Kalabox Reports <postmaster@' + domain + '>',
    to: 'ben@kalamuna.com',
    subject: subject,
    text: text
  };

  return Promise.fromNode(function(cb) {
    mailgun.messages().send(data, cb);
  });

}

/*
 * Return object with a send method.
 */
module.exports = {
  send: send 
};
