
// use mocha for test

var assert = require('assert')
  , ses = require('../')
  , crypto = require('crypto')

function create () {
  return new ses.Email({
      key: 'key'
    , secret: 'secret'
    , algorithm: 'algo'
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

describe('node-ses', function(){
  it('should have createClient and Email exports', function () {
    assert.equal('function', typeof ses.createClient);
    assert.equal('function', typeof ses.Email);
  });
  it('should have a version', function(){
    assert(ses.version);
  })
})

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
  it('should have an algorithm', function(){
    assert.ok(client.algorithm);
  });
  it('algorithm should default to SHA1', function(){
    assert.equal(client.algorithm, 'SHA1');
  });
  it('algorithm should be overiddable', function(){
    var client = ses.createClient({ algorithm: 'different', key: 1, secret: 2 });
    assert.equal(client.algorithm, 'different');
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
  it('should require a key', function(){
    try {
      ses.createClient()
    } catch (err) {
      if (!/key is required/.test(err)) throw err;
    }
  });
  it('should require a secret', function(){
    try {
      ses.createClient({ key: 1 })
    } catch (err) {
      if (!/secret is required/.test(err)) throw err;
    }
  });
  describe('sendemail', function(){
    it('should be a function', function(){
      assert.equal('function', typeof client.sendemail)
    })
  })
})

describe('Email', function(){
  var email = new ses.Email({
      key: 'key'
    , secret: 'secret'
    , algorithm: 'algo'
    , from: 'from'
    , subject: 'subject'
    , message: 'message'
    , altText: 'alt'
    , to: 'to@example.com'
    , cc: 'cc@example.com'
    , bcc: 'bcc@example.com'
    , replyTo: 'bcc@example.com'
  });

  it('should have key', function(){
    assert.equal('key', email.key);
  })
  it('should have secret', function(){
    assert.equal('secret', email.secret);
  })
  it('should have algorithm', function(){
    assert.equal('algo', email.algorithm);
  })
  it('should have from', function(){
    assert.equal('from', email.from);
  })
  it('should have subject', function(){
    assert.equal('subject', email.subject);
  })
  it('should have message', function(){
    assert.equal('message', email.message);
  })
  it('should have altText', function(){
    assert.equal('alt', email.altText);
  })

  describe('#extractRecipient', function(){
    it('should default to an array', function(){
      email.extractRecipient({ to: 'hi' }, 'from');
      assert(Array.isArray(email.from));
      assert.equal(0, email.from.length);
    })
    it('should convert to an array', function (){
      email.extractRecipient({ to: 'hi' }, 'to');
      assert(Array.isArray(email.from));
      assert.equal(1, email.to.length);
      assert.equal('hi', email.to[0]);
    })
    it('should leave arrays untouched', function(){
      email.extractRecipient({ yep: ['hi'] }, 'yep');
      assert(Array.isArray(email.yep));
      assert.equal(1, email.yep.length);
      assert.equal('hi', email.yep[0]);
    })
  })

  describe('#addMessage', function(){
    var email = create();

    it('should be a function', function(){
      assert.equal('function', typeof email.addMessage);
    })

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
    })
  })

  describe('#addDestination', function(){
    var email = create();
    it('should be a function', function(){
      assert.equal('function', typeof email.addDestination);
    })

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
    })



  })

  describe('#addReplyTo', function(){
    var email = create();
    it('should be a function', function(){
      assert.equal('function', typeof email.addReplyTo);
    })
    it('should add replyTo data', function(){
      var msg = email.addReplyTo({});
      assert(msg['ReplyToAddresses.member.1']);
      assert.equal(msg['ReplyToAddresses.member.1'], 'bcc@example.com');
    })
  })

  describe('#signature', function(){
    var email = create();
    email.algorithm = 'SHA1'

    var sig = crypto.createHmac(email.algorithm.toLowerCase(), email.secret)
                .update(email.date)
                .digest('base64');

    it('should be a function', function(){
      assert.equal('function', typeof email.signature);
    })

    it('should compute the base64 hmac', function(){
      assert.equal(sig, email.signature());
    })

    it('should return the same value if called > 1', function(){
      assert.equal(sig, email.signature());
      assert.equal(sig, email.signature());
      assert.equal(email._signature, email.signature());
    })
  })

  describe('#headers', function(){
    var email = create();
    email.algorithm = 'SHA1'

    it('should be a function', function(){
      assert.equal('function', typeof email.headers);
    })

    it('should add headers', function(){
      var h = email.headers({});
      assert(h['X-Amzn-Authorization']);
      assert(/^AWS3-HTTPS /.test(h['X-Amzn-Authorization']));
      assert(/AWSAccessKeyId=/.test(h['X-Amzn-Authorization']));
      assert(/Algorithm=/.test(h['X-Amzn-Authorization']));
      assert(/Signature=/.test(h['X-Amzn-Authorization']));
    })
  })

  describe('#validate', function(){
    var email = create();
    it('should be a function', function(){
      assert.equal('function', typeof email.validate);
    })
    it('should pass', function(){
      assert.equal(undefined, email.validate());
    })
    it('should fail with To is required', function(){
      email.to = [];
      assert.equal("To is required", email.validate());
      email.to = ['works'];
      assert.equal(undefined, email.validate());
    })
    it('should fail with From is required', function(){
      delete email.from;
      assert.equal("From is required", email.validate());
      email.from = null;
      assert.equal("From is required", email.validate());
      email.from = '';
      assert.equal("From is required", email.validate());
      email.from = 'yup@asdf.com';
      assert.equal(undefined, email.validate());
    })
    it('should fail with Subject is required', function(){
      delete email.subject;
      assert.equal("Subject is required", email.validate());
      email.subject = null;
      assert.equal("Subject is required", email.validate());
      email.subject = '';
      assert.equal("Subject is required", email.validate());
      email.subject = 'spammer';
      assert.equal(undefined, email.validate());
    })
  })

  describe('#data', function(){
    var email = create();
    it('should be a function', function(){
      assert.equal('function', typeof email.data);
    })
    it('should contain the formatted emails data', function(){
      var d = email.data({});
      assert(d.Action)
      assert.equal(d.Action, 'SendEmail')
      assert(d.AWSAccessKeyId);
      assert.equal(email.key, d.AWSAccessKeyId);
      assert(d.Signature);
      assert.equal(email.signature, d.Signature);
      assert(d.SignatureMethod);
      assert('Hmac'+email.algorithm, d.SignatureMethod);
      assert(d.SignatureVersion);
      assert.equal(2,d.SignatureVersion);
      assert(d.Version);
      assert.equal('2010-12-01',d.Version);
      assert(d.Expires);
      assert.equal(email.date, d.Expires);
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
    })
  })

  describe('#send', function(){
    var email = create();
    email.algorithm = 'SHA1'
    email.amazon = ses.amazon;
    it('should be a function', function(){
      assert.equal('function', typeof email.send);
    })
    it('should callback an error', function(done){
      email.send(function (err) {
        assert(err);
        assert(/^node-ses failed with status: 403 and data:/.test(err.message));
        done();
      });
    })

    if (process.env.NODE_SES_KEY && process.env.NODE_SES_SECRET) {
      it('should succeed', function(done){
        var client = ses.createClient({
            key: process.env.NODE_SES_KEY
          , secret: process.env.NODE_SES_SECRET
        });
        client.sendemail({
            from: 'noreply@learnboost.com'
          , subject: 'testing node-ses'
          , message: 'this is a test'
          , altText: 'this is an alt txt'
          , to: 'aaron.heckmann+github@gmail.com'
          , cc: 'aaron.heckmann+github@gmail.com'
          , bcc: 'aaron.heckmann+github@gmail.com'
          , replyTo: 'aaron.heckmann+github@gmail.com'
        }, function (err, data) {
          assert(!err);
          assert(data);
          done();
        });
      })
    } else {
      console.error('You are not testing with Amazons SES service');
    }
  })
})
