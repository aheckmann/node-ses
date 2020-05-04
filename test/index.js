'use strict';

// use mocha for test

var assert = require('assert')
  , ses = require('../')
  , crypto = require('crypto');

function create () {
  return new ses.Email({
      key: 'key'
    , secret: 'secret'
    , from: 'from'
    , subject: 'subject'
    , message: 'message'
    , altText: 'alt'
    , to: ['to@example.com', 'one@example.com']
    , cc: 'cc@example.com'
    , bcc: ['bcc@example.com', 'yoyo@example.com']
    , replyTo: 'bcc@example.com'
  });
}

function createRaw (){
  return new ses.Email({
      action : 'SendRawEmail'
    , key: 'key'
    , secret: 'secret'
    , from: 'from'
    , rawMessage: 'rawMessage'
  });
}

describe('node-ses', function(){
  it('should have createClient and Email exports', function (){
    assert.equal('function', typeof ses.createClient);
    assert.equal('function', typeof ses.Email);
  });

  it('should have a version', function(){
    assert(ses.version);
  });
});

describe('createClient', function(){
  var client = ses.createClient({
      key: 'mykey'
    , secret: 'mysecret'
  });

  it('should have a key', function(){
    assert.ok(client.key);
  });

  it('should have a secret', function(){
    assert.ok(client.secret);
  });

  it('should have an amazon property', function(){
    assert.ok(client.amazon);
  });

  it('amazon should default correctly', function(){
    var amazon = 'https://email.us-east-1.amazonaws.com';
    assert.equal(client.amazon, amazon);
  });

  it('amazon should be overiddable', function(){
    var client = ses.createClient({
        amazon: 'http://www.google.com'
      , key: 1
      , secret: 2
    });
    assert.equal(client.amazon, 'http://www.google.com');
  });

  it('should not require options', function(){
    var client = ses.createClient();
    assert.equal(client.key, undefined);
  });

  it('should require a key', function(){
    try {
      ses.createClient();
    } catch (err) {
      if (!/key is required/.test(err)) {
        throw err;
      }
    }
  });

  it('should require a secret', function(){
    try {
      ses.createClient({ key: 1 });
    } catch (err) {
      if (!/secret is required/.test(err)) {
        throw err;
      }
    }
  })

  describe('sendemail', function(){
    it('should be a function', function(){
      assert.equal('function', typeof client.sendemail);
    });
  });

  describe('sendEmail', function(){
    it('should be a function', function(){
      assert.equal('function', typeof client.sendEmail);
    });
  });

  describe('sendRawEmail', function(){
    it('should be a function', function(){
      assert.equal('function', typeof client.sendRawEmail);
    });
  });
});

describe('sendEmail', function(){
  var email = create();

  it('should have key', function(){
    assert.equal('key', email.key);
  });

  it('should have secret', function(){
    assert.equal('secret', email.secret);
  });

  it('should have from', function(){
    assert.equal('from', email.from);
  });

  it('should have subject', function(){
    assert.equal('subject', email.subject);
  });

  it('should have message', function(){
    assert.equal('message', email.message);
  });

  it('should have altText', function(){
    assert.equal('alt', email.altText);
  });

  describe('#extractRecipient', function(){
    it('should default to an array', function(){
      email.extractRecipient({ to: 'hi' }, 'from');
      assert(Array.isArray(email.from));
      assert.equal(0, email.from.length);
    });

    it('should convert to an array', function (){
      email.extractRecipient({ to: 'hi' }, 'to');
      assert(Array.isArray(email.from));
      assert.equal(1, email.to.length);
      assert.equal('hi', email.to[0]);
    });

    it('should leave arrays untouched', function(){
      email.extractRecipient({ yep: ['hi'] }, 'yep');
      assert(Array.isArray(email.yep));
      assert.equal(1, email.yep.length);
      assert.equal('hi', email.yep[0]);
    });
  });

  describe('#addMessage', function(){
    var email = create();

    it('should be a function', function(){
      assert.equal('function', typeof email.addMessage);
    });

    it('should add subject,message,altText', function(){
      var msg = email.addMessage({});
      assert(msg['Message.Subject.Data']);
      assert(msg['Message.Subject.Charset']);
      assert(msg['Message.Body.Html.Data']);
      assert(msg['Message.Body.Html.Charset']);
      assert(msg['Message.Body.Text.Data']);
      assert(msg['Message.Body.Text.Charset']);

      assert.equal(msg['Message.Subject.Data'], 'subject');
      assert.equal(msg['Message.Subject.Charset'], 'UTF-8');
      assert.equal(msg['Message.Body.Html.Data'], 'message');
      assert.equal(msg['Message.Body.Html.Charset'], 'UTF-8');
      assert.equal(msg['Message.Body.Text.Data'], 'alt');
      assert.equal(msg['Message.Body.Text.Charset'], 'UTF-8');
    });
  });

  describe('#addDestination', function(){
    var email = create();
    it('should be a function', function(){
      assert.equal('function', typeof email.addDestination);
    });

    it('should add Destination data', function(){
      var msg = email.addDestination({});
      assert(msg['Destination.ToAddresses.member.1']);
      assert(msg['Destination.ToAddresses.member.2']);
      assert(msg['Destination.CcAddresses.member.1']);
      assert(msg['Destination.BccAddresses.member.1']);
      assert(msg['Destination.BccAddresses.member.2']);
      // todo values
      assert.equal(msg['Destination.ToAddresses.member.1'], 'to@example.com');
      assert.equal(msg['Destination.ToAddresses.member.2'], 'one@example.com');
      assert.equal(msg['Destination.CcAddresses.member.1'], 'cc@example.com');
      assert.equal(msg['Destination.BccAddresses.member.1'], 'bcc@example.com');
      assert.equal(msg['Destination.BccAddresses.member.2'], 'yoyo@example.com');
    });
  });

  describe('#addReplyTo', function(){
    var email = create();

    it('should be a function', function(){
      assert.equal('function', typeof email.addReplyTo);
    });

    it('should add replyTo data', function(){
      var msg = email.addReplyTo({});
      assert(msg['ReplyToAddresses.member.1']);
      assert.equal(msg['ReplyToAddresses.member.1'], 'bcc@example.com');
    });
  });

  describe('#validate', function(){
    var email = create();

    it('should be a function', function(){
      assert.equal('function', typeof email.validate);
    });

    it('should pass', function(){
      assert.equal(undefined, email.validate());
    });

    it('should fail with To, Cc or Bcc is required', function(){
      email.to = [];
      email.cc = [];
      email.bcc = [];
      assert.equal('To, Cc or Bcc is required', email.validate());

      email.cc = ['works'];
      assert.equal(undefined, email.validate());
      email.cc = [];

      email.bcc = ['works'];
      assert.equal(undefined, email.validate());
      email.bcc = [];

      email.to = ['works'];
      assert.equal(undefined, email.validate());
    });

    it('should fail with From is required', function(){
      delete email.from;
      assert.equal('From is required', email.validate());
      email.from = null;
      assert.equal('From is required', email.validate());
      email.from = '';
      assert.equal('From is required', email.validate());
      email.from = 'yup@asdf.com';
      assert.equal(undefined, email.validate());
    });

    it('should fail with Subject is required', function(){
      delete email.subject;
      assert.equal('Subject is required', email.validate());
      email.subject = null;
      assert.equal('Subject is required', email.validate());
      email.subject = '';
      assert.equal('Subject is required', email.validate());
      email.subject = 'spammer';
      assert.equal(undefined, email.validate());
    });
  });

  describe('#data', function(){
    var email = create();

    it('should be a function', function(){
      assert.equal('function', typeof email.data);
    });

    it('should contain the formatted emails data', function(){
      var d = email.data({});
      assert(d.Action);
      assert.equal(d.Action, 'SendEmail');
      assert(d.AWSAccessKeyId);
      assert.equal(email.key, d.AWSAccessKeyId);
      assert(d.Source);
      assert.equal(email.from, d.Source);
      assert(d['Destination.ToAddresses.member.1']);
      assert(d['Destination.CcAddresses.member.1']);
      assert(d['Destination.BccAddresses.member.1']);
      assert(d['Message.Subject.Data']);
      assert(d['Message.Subject.Charset']);
      assert(d['Message.Body.Html.Data']);
      assert(d['Message.Body.Html.Charset']);
      assert(d['Message.Body.Text.Data']);
      assert(d['Message.Body.Text.Charset']);
      assert(d['ReplyToAddresses.member.1']);
    });
  });

  describe('#send', function(){
    var email = create();

    email.amazon = ses.amazon;

    it('should be a function', function(){
      assert.equal('function', typeof email.send);
    });

    it('should callback an error', function(done){
      this.timeout(20000);
      var calledTimes = 0;
      email.send(function (err) {
        calledTimes++;
        assert.equal(calledTimes,1,'callback was called only once');
        assert(err);
        assert(err.Message);
        assert(/Non-whitespace/.test(err.Message));
        // Wait to see if the code is accidentally going to run the test before declaring done.
        setTimeout(done,1000);
      });
    });

    if (process.env.NODE_SES_KEY && process.env.NODE_SES_SECRET && process.env.NODE_SES_EMAIL) {
      it('should succeed and return the response from aws as object', function(done){
        var client = ses.createClient({
            key: process.env.NODE_SES_KEY
          , secret: process.env.NODE_SES_SECRET
        });
        this.timeout(20000);

        client.sendemail({
            from: process.env.NODE_SES_EMAIL
          , subject: 'testing node-ses'
          , message: 'this is a test'
          , altText: 'this is an alt txt'
          , to: process.env.NODE_SES_EMAIL
          , cc: process.env.NODE_SES_EMAIL
          , bcc: process.env.NODE_SES_EMAIL
          , replyTo: process.env.NODE_SES_EMAIL
        }, function (err, data) {
          assert(!err);
          assert(data);
          assert(typeof(data) === 'object');
          assert(data.SendEmailResponse);
          assert(data.SendEmailResponse.ResponseMetadata);
          done();
        });
      });
    } else {
      console.error('You are not testing with Amazons SES service');
    }
  });
});

describe('_processResponse', function () {
  var email = create();

  it('should errback with error Type:NodeSesInternal error if there is an error with the HTTP request', function(done) {
      email._processResponse({ message: 'BOOM'}, undefined, undefined, function (error) {
          assert.deepEqual(error, {
            Type: 'NodeSesInternal',
            Code: 'RequestError',
            Message: {
              message : 'BOOM'
            }
          });
          done();
      })
  });

  it('Should errback w/XmlError if error response cannot be parsed', done => {
      var res = { statusCode : 500 };
      var data = 'BOOM';
      email._processResponse(undefined,  res , data, function (error) {
          assert.deepEqual(error, {
            Type: 'NodeSesInternal',
            Code: 'XmlError',
            Message:  null,
          });
          done();
      })
  });
});

describe('sendRawEmail', function(){
  var email = createRaw();

  it('should have key', function(){
    assert.equal('key', email.key);
  });

  it('should have secret', function(){
    assert.equal('secret', email.secret);
  });

  it('should have from', function(){
    assert.equal('from', email.from);
  });

  it('should have rawMessage', function () {
    assert.equal('rawMessage', email.rawMessage);
  });

  describe('#headers', function(){
    var email = createRaw();

    it('should be a function', function(){
      assert.equal('function', typeof email.headers);
    });

  });

  describe('#validate', function(){
    var email = createRaw();

    it('should be a function', function(){
      assert.equal('function', typeof email.validate);
    });

    it('should pass', function(){
      assert.equal(undefined, email.validate());
    });

    it('should fail with From is required', function(){
      delete email.from;
      assert.equal('From is required', email.validate());
      email.from = null;
      assert.equal('From is required', email.validate());
      email.from = '';
      assert.equal('From is required', email.validate());
      email.from = 'yup@asdf.com';
      assert.equal(undefined, email.validate());
    });

    it('should fail with Raw message is required', function(){
      delete email.rawMessage;
      assert.equal('Raw message is required', email.validate());
      email.rawMessage = null;
      assert.equal('Raw message is required', email.validate());
      email.rawMessage = '';
      assert.equal('Raw message is required', email.validate());
      email.rawMessage = 'rawMessage';
      assert.equal(undefined, email.validate());
    });
  });

  describe('#data', function(){
    var email = createRaw();

    it('should be a function', function(){
      assert.equal('function', typeof email.data);
    });

    it('should contain the formatted emails data', function(){
      var d = email.data();
      assert(d.Action);
      assert.equal(d.Action, 'SendRawEmail');
      assert(d.AWSAccessKeyId);
      assert.equal(email.key, d.AWSAccessKeyId);
      assert(d.Source);
      assert.equal(email.from, d.Source);
      assert(d['RawMessage.Data']);
    });
  });

  describe('#send raw', function(){
    var email = createRaw();

    email.amazon = ses.amazon;

    it('should be a function', function(){
      assert.equal('function', typeof email.send);
    });

    it('should callback an error', function(done){
      this.timeout(20000);
      var calledTimes = 0;
      email.send(function (err) {
        calledTimes++;
        assert.equal(calledTimes,1,'callback was called only once');
        assert(err);
        //assert(err.Message);
        //assert(/^The security token included in the request is invalid/.test(err.Message));
        // Wait to see if the code is accidentally going to run the test before declaring done.
        setTimeout(done,2000);
      });
    });

    if (process.env.NODE_SES_KEY && process.env.NODE_SES_SECRET) {
      it('should succeed', function(done){
        var client = ses.createClient({
            key: process.env.NODE_SES_KEY
          , secret: process.env.NODE_SES_SECRET
        });

        client.sendRawEmail({
            from: process.env.NODE_SES_EMAIL
            , rawMessage: [
              'From: <'+process.env.NODE_SES_EMAIL+'>'
            , 'To: <'+process.env.NODE_SES_EMAIL+'>'
            , 'Subject: greetings'
            , 'Content-Type: multipart/mixed;'
            , '    boundary="_003_97DCB304C5294779BEBCFC8357FCC4D2"'
            , 'MIME-Version: 1.0'
            , ''
            , '--_003_97DCB304C5294779BEBCFC8357FCC4D2'
            , 'Content-Type: text/plain; charset="us-ascii"'
            , 'Content-Transfer-Encoding: quoted-printable'
            , 'Hi Aaron,'
            , ''
            , 'Sample code file from tests in node-ses.'
            , ''
            , 'Cheers,'
            , '@brozeph'
            , ''
            , '--_003_97DCB304C5294779BEBCFC8357FCC4D2'
            , 'Content-Type: text/plain; name="code.txt"'
            , 'Content-Description: code.txt'
            , 'Content-Disposition: attachment; filename="code.txt"; size=4;'
            , '    creation-date="Mon, 03 Aug 2015 11:39:39 GMT";'
            , '    modification-date="Mon, 03 Aug 2015 11:39:39 GMT"'
            , 'Content-Transfer-Encoding: base64'
            , ''
            , 'ZWNobyBoZWxsbyB3b3JsZAo='
            , ''
            , '--_003_97DCB304C5294779BEBCFC8357FCC4D2'
            , ''
          ].join('\r\n')
        }, function (err, data) {
          assert(!err);
          assert(data);
          done();
        });
      });
    } else {
      console.error('You are not testing with Amazons SES service');
    }
  });
});
