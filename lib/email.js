'use strict';

var crypto = require('crypto')
  , debug = require('debug')('node-ses')
  , parse = require('url').parse
  , querystring = require('querystring')
  , request = require('request')
  , xmlParser = new require('xml2js').Parser({explicitArray:false,mergeAttrs:true})

  // Declare constants for details of AWS SES API that we depend on.
  , DEFAULT_AUTH_PATTERN = [
      'AWS3-HTTPS AWSAccessKeyId={key}'
    , 'Algorithm={algorithm}'
    , 'Signature={signature}'].join(', ')
  , DEFAULT_API_VERSION = '2010-12-01'
  , DEFAULT_SIGNATURE_VERSION = 2

  , SEND_EMAIL_ACTION = 'SendEmail'
  , SEND_RAW_EMAIL_ACTION = 'SendRawEmail';


/**
 * Sends a request to the AWS service.
 * @private
 *
 * @param {String} url
 * @param {Object} data
 * @param {Object} headers
 * @param {Function} callback
 *
 * TODO: support more than sendmail
 **/
// jshint sub : true
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

    if (err) {
      return callback({
        Type : "NodeSesInternal",
        Code : "RequestError",
        Message: err,
      }, data, res);
    }

    if (res.statusCode < 200 || res.statusCode >= 400) {
      return xmlParser.parseString(data,function(err,result){
          if(err) {
            return callback({
              Type: "NodeSesInternal",
              Code: "ParseError",
              Message: err
            });
          }

          // Return an error object with keys of Type, Code and Message
          // Rference docs at: http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html
          return callback(result.ErrorResponse.Error);
      });
    }
    return callback(null, data, res);
  });
}


/**
 * Email constructor.
 *
 * @param {Object} options
 **/
function Email (options) {
  this.action = options.action || SEND_EMAIL_ACTION;
  this.key = options.key;
  this.secret = options.secret;
  this.algorithm = options.algorithm;
  this.amazon = options.amazon;
  this.from = options.from;
  this.subject = options.subject;
  this.message = options.message;
  this.altText = options.altText;
  this.rawMessage = options.rawMessage;
  this.date = new Date(Date.now() + 10000).toUTCString();
  this.extractRecipient(options, 'to');
  this.extractRecipient(options, 'cc');
  this.extractRecipient(options, 'bcc');
  this.extractRecipient(options, 'replyTo');
}


/**
 * Adds to, cc, and bcc fields to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addDestination = function (data) {
  this.to.forEach(function (to, i) {
    data['Destination.ToAddresses.member.' + (i + 1)] = to;
  });

  this.cc.forEach(function (to, i) {
    data['Destination.CcAddresses.member.' + (i + 1)] = to;
  });

  this.bcc.forEach(function (to, i) {
    data['Destination.BccAddresses.member.' + (i + 1)] = to;
  });

  return data;
};


/**
 * Adds subject, alt text, and message body to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addMessage = function (data) {
  if (this.subject) {
    data['Message.Subject.Data'] = this.subject;
    data['Message.Subject.Charset'] = 'UTF-8';
  }

  if (this.message) {
    data['Message.Body.Html.Data'] = this.message;
    data['Message.Body.Html.Charset'] = 'UTF-8';
  }

  if (this.altText) {
    data['Message.Body.Text.Data'] = this.altText;
    data['Message.Body.Text.Charset'] = 'UTF-8';
  }

  return data;
};


/**
 * Adds the list of ReplyTos to `data`.
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addReplyTo = function (data) {
  this.replyTo.forEach(function(to, i) {
    data['ReplyToAddresses.member.' + (i + 1)] = to;
  });

  return data;
};


/**
 * Prepares param object for the AWS request.
 *
 * @return {Object}
 */
Email.prototype.data = function () {
  var data = {
      Action: this.action
    , AWSAccessKeyId: this.key
    , Signature: this.signature
    , SignatureMethod: 'Hmac' + this.algorithm
    , SignatureVersion: DEFAULT_SIGNATURE_VERSION
    , Version: DEFAULT_API_VERSION
    , Expires: this.date
    , Source: this.from
  };

  // recipients and reply tos
  data = this.addDestination(data);
  data = this.addReplyTo(data);

  // message payload
  if (this.action === SEND_EMAIL_ACTION) {
    data = this.addMessage(data);
  } else if (this.action === SEND_RAW_EMAIL_ACTION) {
    data['RawMessage.Data'] = new Buffer(this.rawMessage).toString('base64');
  }

  return data;
};


/**
 * Extracts recipients from options.
 *
 * @param {String} prop - either to,cc,bcc,replyTo
 * @param {Object} options
 */
Email.prototype.extractRecipient = function (options, prop) {
  if (options[prop]) {
    this[prop] = Array.isArray(options[prop]) ? options[prop] : [options[prop]];
  } else {
    this[prop] = [];
  }
};


/**
 * Creates required AWS headers.
 *
 * @return Object
 **/
Email.prototype.headers = function () {
  var headers = {};

  headers.Date = this.date;
  headers['X-Amzn-Authorization'] = DEFAULT_AUTH_PATTERN
    .replace('{key}', this.key)
    .replace('{algorithm}', 'Hmac' + this.algorithm)
    .replace('{signature}', this.signature());

	return headers;
};


/**
 * Sends the email.
 *
 * @param {Function} callback
 * @api Public
 **/
Email.prototype.send = function send (callback) {
  var invalid = this.validate();

  if (invalid) {
    return callback(new Error(invalid));
  }

  return post(this.amazon, this.data(), this.headers(), callback);
};


/**
 * Creates the Amazon signature for the request.
 *
 * @return base64 encoded string
 **/
Email.prototype.signature = function () {
  if (this._signature) {
    return this._signature;
  }

  this._signature = crypto
    .createHmac(this.algorithm.toLowerCase(), this.secret)
    .update(this.date)
    .digest('base64');

  return this._signature;
};


/**
 * Validates the input.
 *
 * @returns {String|Undefined}
 **/
Email.prototype.validate = function () {
  if (this.action === SEND_EMAIL_ACTION) {
    if (!this.to.length && !this.cc.length && !this.bcc.length) {
      return 'To, Cc or Bcc is required';
    }

    if (!(this.subject && this.subject.length)) {
      return 'Subject is required';
    }
  }

  if (this.action === SEND_RAW_EMAIL_ACTION) {
    if (!(this.rawMessage && this.rawMessage.length)) {
      return 'Raw message is required';
    }
  }

  // all actions require the following
  if (!(this.from && this.from.length)) {
    return 'From is required';
  }
};

/**
 * Exports
 **/
exports.Email = Email;

exports.actions = {
  SendEmail : SEND_EMAIL_ACTION,
  SendRawEmail : SEND_RAW_EMAIL_ACTION
};
