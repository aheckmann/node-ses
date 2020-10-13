'use strict';

const aws4 = require('aws4');
const debug = require('debug')('node-ses');
const parse = require('url').parse;
const querystring = require('querystring');
const request = require('request');
const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser({explicitArray:false,mergeAttrs:true});

const SEND_EMAIL_ACTION = 'SendEmail';
const SEND_RAW_EMAIL_ACTION = 'SendRawEmail';

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
  this.configurationSet = options.configurationSet;
  this.messageTags = options.messageTags;
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
 * Adds ConfigurationSetName and Tags to `data`
 *
 * @param {Object} data
 * @return data
 **/
Email.prototype.addSESHeaders = function (data) {
  if (this.configurationSet) {
    data['ConfigurationSetName'] = this.configurationSet;
  }
  if (this.messageTags) {
    this.messageTags.forEach(function (tagSpec, i) {
      data['Tags.member.' + (i + 1) + '.Name'] = tagSpec.name;
      data['Tags.member.' + (i + 1) + '.Value'] = tagSpec.value;
    });
  }
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

  // SES Event Publishing Information
  data = this.addSESHeaders(data);

  // message payload
  if (this.action === SEND_EMAIL_ACTION) {
    data = this.addMessage(data);
  } else if (this.action === SEND_RAW_EMAIL_ACTION) {
    data['RawMessage.Data'] = Buffer.from(this.rawMessage).toString('base64');
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
  const invalid = this.validate();

  if (invalid) {
    return callback(new Error(invalid));
  }

  // Prepare the data and send to it AWS SES REST API

  var data = querystring.stringify(this.data());
  var parsedUrl = parse(this.amazon);
  var headers = this.headers();

  var options = {
      uri: this.amazon
    , host: parsedUrl.hostname
    , headers: headers
    , body: data
    , service: 'ses'
  };

  var credentials = this.key && this.secret && {
    accessKeyId : this.key,
    secretAccessKey : this.secret
  };
  var signedOpts = aws4.sign(options, credentials);

  debug('posting: %j', signedOpts);

  request(signedOpts, (err, res, data) => this._processResponse(err, res, data, callback));
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
    return xmlParser.parseString(data,function(err,result){
        if(err) {
          return callback({
            Type: "NodeSesInternal",
            Code: "ParseError",
            Message: err
          });
        }

        // Return an error object with keys of Type, Code and Message
        // Reference docs at: http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html
        if(result && result.ErrorResponse){
          return callback(result.ErrorResponse.Error)
        }
        // Once during an S3 outage AWS returned valid XML that didn't match the usual error structure.
        // We cover this unlikely case
        else {
          return callback({
            Type : "NodeSesInternal",
            Code : "XmlError",
            Message: result,
          })
        }

    });
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
