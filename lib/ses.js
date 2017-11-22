// node-ses
'use strict';

var email = require('./email')
  , DEFAULT_API_HOST = 'https://email.us-east-1.amazonaws.com';


/**
 * SESClient
 *
 * `options` is an object with these properties:
 *
 *    key - your AWS SES key
 *    secret - your AWS SES secret
 *    amazon - [optional] the amazon end-point uri. defaults to amazon `https://email.us-east-1.amazonaws.com`
 *
 * Example:
 *
 *     var client = new SESClient({ key: 'key', secret: 'secret' });
 *     client.sendemail({
 *        to: 'aaron.heckmann+github@gmail.com'
 *      , from: 'somewhereOverTheR@inbow.com'
 *      , cc: 'theWickedWitch@nerds.net'
 *      , bcc: ['canAlsoBe@nArray.com', 'forrealz@.org']
 *      , subject: 'greetings'
 *      , message: 'your message goes here'
 *      , altText: 'mmm hmm'
 *    }, function (err) {
 *      // ...
 *    });
 *
 * @param {Object} options
 */
function SESClient (options) {
  options = options || {};
  this.key = options.key;
  this.secret = options.secret;
  this.amazon = options.amazon || exports.amazon;
}


/**
 * Send an email
 *
 * @param {Object} options
 * @param {Function} callback
 */
SESClient.prototype.sendEmail = function (options, callback) {
  options.key = options.key || this.key;
  options.secret = options.secret || this.secret;
  options.amazon = options.amazon || this.amazon;
  options.action = email.actions.SendEmail;

  var message = new email.Email(options);
  message.send(callback);
};

/**
 * Send an email (convenience alias to sendemail)
 *
 * @param {Object} options
 * @param {Function} callback
 **/
SESClient.prototype.sendemail = SESClient.prototype.sendEmail;

/**
 * Send an email (raw)
 *
 * @param {Object} options
 * @param {Function} callback
 */
SESClient.prototype.sendRawEmail = function (options, callback) {
  options.key = options.key || this.key;
  options.secret = options.secret || this.secret;
  options.amazon = options.amazon || this.amazon;
  options.action = email.actions.SendRawEmail;

  var message = new email.Email(options);
  message.send(callback);
};

/**
 * Exports
 **/
exports.createClient = function createClient (options) {
  return new SESClient(options);
};

exports.Email = email.Email;
exports.amazon = DEFAULT_API_HOST;
exports.version = require('../package.json').version;
