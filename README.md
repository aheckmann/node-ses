#node-ses
==========

An Amazon SES api for nodejs with proper error handling.

_This module implements the SendEmail action only. What more do you need? ;)_

```js
var ses = require('node-ses')
  , client = ses.createClient({ key: 'key', secret: 'secret' });

client.sendemail({
   to: 'aaron.heckmann+github@gmail.com'
 , from: 'somewhereOverTheR@inbow.com'
 , cc: 'theWickedWitch@nerds.net'
 , bcc: ['canAlsoBe@nArray.com', 'forrealz@.org']
 , subject: 'greetings'
 , message: 'your <b>message</b> goes here'
 , altText: 'plain text'
}, function (err, data, res) {
 // ...
});
```

## install

`npm install node-ses`

The module has one primary export:

##createClient()

You'll probably only be using this method. It takes an options object with the following properties:

    `key` - (required) your AWS SES key
    `secret` - (required) your AWS SES secret
    `algorithm` - [optional] the AWS algorithm you are using. defaults to SHA1.
    `amazon` - [optional] the amazon end-point uri. defaults to amazon east.

```js
var ses = require('node-ses')
  , client = ses.createClient({ key: 'key', secret: 'secret' });
```

## client.sendemail(options, function (err, data, res))

The client created has one method, `sendemail`. This method receives an options object with the following properties:

    `from` - email address from which to send
    `subject` - string
    `message` - can be html
    `altText` - plain text version of message
    `to` - email address or array of addresses
    `cc` - email address or array of addresses
    `bcc` - email address or array of addresses
    `replyTo` - email address

Optional properties (overrides the values set in `createClient`):

    `key` - AWS key
    `secret` - AWS secret
    `algorithm` - AWS algorithm to use
    `amazon` - AWS end point

The `sendmail` method transports your message to the AWS SES service. If Amazon
returns an HTTP status code that's less than `200` or greater than or equal to
400, we will callback with an `err` object that is a direct translation of the XML error Amazon provides.
Check for errors returned since a 400 status is not uncommon.

The `data` returned in the callback is the HTTP body returned by Amazon as XML.
See the [SES API Response](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html) docs for details.

The `res` returned by the callback represents the HTTP response to calling the SES REST API as the [request](https://www.npmjs.org/package/request) module returns it.

## tests

`make test`

## Licence

[MIT](https://github.com/aheckmann/node-ses/blob/master/LICENSE)
