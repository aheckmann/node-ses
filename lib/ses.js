// node-ses
'use strict';

var email = require('./email')

  , DEFAULT_API_HOST = 'https://email.us-east-1.amazonaws.com'
  , DEFAULT_SIGNATURE_ALGORITHM = 'SHA1';


/**
 * Options helper.
 * @private
 */
function expect (options, key) {
  if (options && options[key]) {
    return options[key];
  }

  throw new Error(key + ' is required');
}

/**
 * SESClient
 *
 * `options` is an object with these properties:
 *
 *    key - your AWS SES key
 *    secret - your AWS SES secret
 *    algorithm - [optional] the AWS algorithm you are using. defaults to SHA1.
 *    amazon - [optional] the amazon end-point uri. defaults to amazon east.
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
  this.key = expect(options, 'key');
  this.secret = expect(options, 'secret');
  this.algorithm = options.algorithm || exports.algorithm;
  this.amazon = options.amazon || exports.amazon;
}


/**
 * Send an email
 *
 * @param {Object} options
 * @param {Function} callback
 */
SESClient.prototype.sendEmail = function (options, callback) {
  options.key = options.key = this.key;
  options.secret = options.secret || this.secret;
  options.algorithm = options.algorithm || this.algorithm;
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
  options.algorithm = options.algorithm || this.algorithm;
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
exports.algorithm = DEFAULT_SIGNATURE_ALGORITHM;
exports.version = require('../package').version;
