'use strict';

var aws4 = require('aws4')
  , debug = require('debug')('node-ses')
  , parse = require('url').parse
  , querystring = require('querystring')
  , request = require('request')
  , SEND_EMAIL_ACTION = 'SendEmail'
  , SEND_RAW_EMAIL_ACTION = 'SendRawEmail';


/**
 * Email constructor.
 *
 * @param {Object} options
 **/
function Email (options) {
  this.action = options.action || SEND_EMAIL_ACTION;
  this.key = options.key;
  this.secret = options.secret;
  this.amazon = options.amazon;
  this.from = options.from;
  this.subject = options.subject;
  this.message = options.message;
  this.altText = options.altText;
  this.rawMessage = options.rawMessage;
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
 * No additional custom headers by default.
 *
 * @return Object
 **/
Email.prototype.headers = function () {
  var headers = {};
  return headers;
};

/**
 * Sends the email.
 *
 * @param {Function} callback
 * @api Public
 **/
Email.prototype.send = function send (callback) {
	var self = this;

  var invalid = self.validate();

  if (invalid) {
    return callback(new Error(invalid));
  }

	// Prepare the data and send to it AWS SES REST API

  var data = querystring.stringify(self.data());
  var parsedUrl = parse(self.amazon);
  var headers = self.headers();

  headers['Connection'] = 'Keep-Alive';

  var options = {
      uri: self.amazon
    , host: parsedUrl.hostname
    , headers: headers
    , body: data
    , service: 'ses'
    , json: true
  };

	var signedOpts = aws4.sign(options, {
    accessKeyId : self.key,
    secretAccessKey : self.secret
	});

  debug('posting: %j', signedOpts);

  request(signedOpts, function (err, res, data) {
 			self._processResponse(err, res, data, callback)
	});
};

/**
 * Process a response from the 'request' call used to POST email to SES
 * @private
 *
 */
Email.prototype._processResponse = function _processResponse (err, res, data, callback) {
  debug('received: %s %d %j', err, res && res.statusCode || 0, data);

  if (err) {
    return callback({
      Type : "NodeSesInternal",
      Code : "RequestError",
      Message: err,
    }, data, res);
  }

  if (res.statusCode < 200 || res.statusCode >= 400) {
    if(data && data.Error) {
      return callback(data.Error);
    } else {
      // Once during an S3 outage AWS error responses had invalid schema.
      // Cover the unlikely scenario, that error json response has wrong structure by this custom error.
      return callback({
        Type : "NodeSesInternal",
        Code : "JsonError",
        Message: new Error("Malformed error response from aws: " + data)
      });
    }
  } else {
    return callback(null, data, res);
  }
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
