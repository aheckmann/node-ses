// node-ses

var request = require('request')
  , crypto = require('crypto')
  , parse = require('url').parse
  , querystring = require('querystring')
  , debug = require('debug')('node-ses')
  , xmlParser = require('xml2json');

var Authorization = "AWS3-HTTPS AWSAccessKeyId={key}, Algorithm={algorithm}, Signature={Signature}";

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

SESClient.prototype.sendemail = function (options, callback) {
  options.key = options.key = this.key;
  options.secret = options.secret || this.secret;
  options.algorithm = options.algorithm || this.algorithm;
  options.amazon = options.amazon || this.amazon;
  var email = new Email(options);
  email.send(callback);
}

/**
 * Email constructor.
 *
 * @param {Object} options
 */

function Email (options) {
  this.key = options.key;
  this.secret = options.secret;
  this.algorithm = options.algorithm;
  this.amazon = options.amazon;
  this.from = options.from;
  this.subject = options.subject;
  this.message = options.message;
  this.altText = options.altText;
  this.date = new Date(Date.now() + 10000).toUTCString();
  this.extractRecipient(options, 'to');
  this.extractRecipient(options, 'cc');
  this.extractRecipient(options, 'bcc');
  this.extractRecipient(options, 'replyTo');
}

/**
 * Extracts recipients from options.
 *
 * @param {String} prop - either to,cc,bcc,replyTo
 * @param {Object} options
 */

Email.prototype.extractRecipient = function (options, prop) {
  if (options[prop]) {
    this[prop] = Array.isArray(options[prop])
      ? options[prop]
      : [options[prop]]
  } else {
    this[prop] = [];
  }
}

/**
 * Prepares param object for the AWS request.
 *
 * @return {Object}
 */

Email.prototype.data = function () {
  var data = {
      Action: "SendEmail"
    , AWSAccessKeyId: this.key
    , Signature: this.signature
    , SignatureMethod: 'Hmac' + this.algorithm
    , SignatureVersion: 2
    , Version: "2010-12-01"
    , Expires: this.date
    , Source: this.from
  }

  data = this.addDestination(data);
  data = this.addMessage(data);
  data = this.addReplyTo(data);

  return data;
}

/**
 * Adds subject, alt text, and message body to `data`.
 *
 * @param {Object} data
 * @return data
 */

Email.prototype.addMessage = function (data) {
  if (this.subject) {
    data["Message.Subject.Data"] = this.subject;
    data["Message.Subject.Charset"] = 'UTF-8';
  }

  if (this.message) {
    data["Message.Body.Html.Data"] = this.message;
    data["Message.Body.Html.Charset"] = 'UTF-8';
  }

  if (this.altText) {
    data["Message.Body.Text.Data"] = this.altText;
    data["Message.Body.Text.Charset"] = 'UTF-8';
  }

  return data;
}

/**
 * Adds to, cc, and bcc fields to `data`.
 *
 * @param {Object} data
 * @return data
 */

Email.prototype.addDestination = function (data) {
  this.to.forEach(function (to, i) {
    data["Destination.ToAddresses.member." + (i + 1)] = to;
  });

  this.cc.forEach(function (to, i) {
    data["Destination.CcAddresses.member." + (i + 1)] = to;
  });

  this.bcc.forEach(function (to, i) {
    data["Destination.BccAddresses.member." + (i + 1)] = to;
  });

  return data;
}

/**
 * Adds the list of ReplyTos to `data`.
 *
 * @param {Object} data
 * @return data
 */

Email.prototype.addReplyTo = function (data) {
  this.replyTo.forEach(function(to, i) {
    data["ReplyToAddresses.member." + (i + 1)] = to;
  });
  return data;
}

/**
 * Creates required AWS headers.
 *
 * @return Object
 */

Email.prototype.headers = function () {
  var headers = {};
  headers.Date = this.date;
  headers['X-Amzn-Authorization'] =
    Authorization.replace("{key}", this.key)
                 .replace("{algorithm}", 'Hmac' + this.algorithm)
                 .replace("{Signature}", this.signature());
  return headers;
}

/**
 * Creates the Amazon signature for the request.
 *
 * @return base64 encoded string
 */

Email.prototype.signature = function () {
  if (this._signature) return this._signature;
  var sig = crypto.createHmac(this.algorithm.toLowerCase(), this.secret)
                  .update(this.date)
                  .digest('base64');
  return this._signature = sig;
}

/**
 * Validates the input.
 *
 * @returns {String|Undefined}
 */

Email.prototype.validate = function () {
  if (!this.to.length) return "To is required";
  if (!(this.from && this.from.length)) return "From is required";
  if (!(this.subject && this.subject.length)) return "Subject is required";
}

/**
 * Sends the email.
 *
 * @param {Function} callback
 * @api Public
 */

Email.prototype.send = function send (callback) {
  var invalid = this.validate();
  if (invalid) return callback(new Error(invalid));
  post(this.amazon, this.data(), this.headers(), callback);
}

/**
 * Sends a request to the AWS service.
 *
 * @param {String} url
 * @param {Object} data
 * @param {Object} headers
 * @param {Function} callback
 *
 * TODO: support more than sendmail
 */

function post (url, data, headers, callback) {
  data = querystring.stringify(data);

  var parsedUrl = parse(url);

  headers.Host = parsedUrl.hostname;
  headers['Content-Type'] = 'application/x-www-form-urlencoded';
  headers['Content-Length'] = data.length;
  headers['Connection'] = 'Keep-Alive';

  var options = {
      url: url
    , headers: headers
    , encoding: 'utf8'
    , body: data
    , method: 'POST'
  };

  debug('posting: %j', data);

  request(options, function (err, res, data) {
    debug('received: %s %d %j', err, res && res.statusCode || 0, data);

    if (err) return callback(err, data, res);

    if (res.statusCode < 200 || res.statusCode >= 400) {
      var msg = xmlParser.toJson(data,  {object:true});
      if(!msg.ErrorResponse){
        return callback("Unknown error: " + data);
      }
      return callback(msg["ErrorResponse"]["Error"]);
    }

    callback(null, data, res);
  });
}

/**
 * Options helper.
 * @private
 */

function expect (options, key) {
  if (options && options[key]) return options[key];
  throw new Error(key + ' is required');
}

/**
 * Expose.
 */

exports.createClient = function createClien (options) {
  return new SESClient(options);
}

exports.Email = Email;
exports.amazon = 'https://email.us-east-1.amazonaws.com';
exports.algorithm = 'SHA1';
exports.version = require('../package').version;
