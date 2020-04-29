# node-ses
==========

A simple and reliable Node.js mail for sending mail through Amazon SES.

## Benefits

 * Does only one thing and does it well. Only the [SendEmail](http://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html) and [SendRawEmail](http://docs.aws.amazon.com/ses/latest/APIReference/API_SendRawEmail.html) API methods are implemented.
 * Good error handling:
   * Only "2xx" and "3xx" responses from Amazon are considered successful.
   * Returned error objects are the _Error_ elements of [Amazon's error responses](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html) with _Type_, _Code_, _Message_ etc.
   * Support for the `debug` module is included if [debugging](#debugging) is needed.
 * Tested and reliable. Includes test suite. Sending email to SES since 2012.

## Synopsis

Start by creating a client object, and then call either the `sendEmail` or `sendRawEmail` method
depending on your needs.

```javascript
var ses = require('node-ses')
  , client = ses.createClient({key: 'key', secret: 'secret'});

// Give SES the details and let it construct the message for you.
client.sendEmail({
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

// ... or build a message from scratch yourself and send it.
client.sendRawEmail({
 , from: 'somewhereOverTheR@inbow.com'
 , rawMessage: rawMessage
}, function (err, data, res) {
 // ...
});
```

## Installation

`npm install node-ses`

The module has one primary export:

## createClient()

You'll probably only be using this method. It takes an options object with the following properties:

    `key` -  your AWS SES key. Defaults to checking `process.env.AWS_ACCESS_KEY_ID` and `process.env.AWS_ACCESS_KEY`
    `secret` - your AWS SES secret. Defaults to `process.env.AWS_SECRET_ACCESS_KEY` and `process.env.AWS_SECRET_KEY`
    `amazon` - [optional] the amazon end-point uri. defaults to `https://email.us-east-1.amazonaws.com`

Not all AWS regions support SES. Check [SES region support](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/regions.html) to be sure the region you are in is supported.


```js
var ses = require('node-ses')
  , client = ses.createClient({ key: 'key', secret: 'secret' });
```

## client.sendEmail(options, function (err, data, res))

Composes an email message based on input data, and then immediately queues the message for sending.

There are several important points to know about SendEmail:

 * You can only send email from verified email addresses and domains; otherwise, you will get an "Email address not verified" error. If your account is still in the Amazon SES sandbox, you must also verify every recipient email address except for the recipients provided by the Amazon SES mailbox simulator. For more information, go to the [Amazon SES Developer Guide](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-addresses-and-domains.html).
 * The total size of the message cannot exceed 10 MB. This includes any attachments that are part of the message.
 * Amazon SES has a limit on the total number of recipients per message. The combined number of To:, CC: and BCC: email addresses cannot exceed 50. If you need to send an email message to a larger audience, you can divide your recipient list into groups of 50 or fewer, and then call Amazon SES repeatedly to send the message to each group.
 * For every message that you send, the total number of recipients (To:, CC: and BCC:) is counted against your sending quota - the maximum number of emails you can send in a 24-hour period. For information about your sending quota, go to the [Amazon SES Developer Guide](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/manage-sending-limits.html).


`sendEmail` receives an options object with the following properties:

    `from` - email address from which to send (required)
    `subject` - string (required). Must be encoded as UTF-8
    `message` - can be html (required). Must be encoded as UTF-8.
    `altText` - plain text version of message. Must be encoded as UTF-8.
    `to` - email address or array of addresses
    `cc` - email address or array of addresses
    `bcc` - email address or array of addresses
    `replyTo` - email address
    `configurationSet` - SES configuration set name
    `messageTags` - SES message tags: array of name/value objects, e.g. { name: xid, value: 1 }

At least one of `to`, `cc` or `bcc` is required.

Optional properties (overrides the values set in `createClient`):

    `key` - AWS key
    `secret` - AWS secret
    `amazon` - AWS end point. Defaults to `https://email.us-east-1.amazonaws.com`

The `sendEmail` method transports your message to the AWS SES service. If AWS
returns an HTTP status code that's less than `200` or greater than or equal to
400, we will callback with an `err` object that is a direct tranalation of the _Error_ element of the AWS error response.

See [Error Handling](#error-handling) section below for details on the structure of returned errors.

Check for errors returned since a 400 status is not uncommon.

The `data` returned in the callback is an object containing the parsed AWS response.

See the [SES API Response](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html) docs for details.

The `res` returned by the callback represents the HTTP response to calling the SES REST API as the [request](https://www.npmjs.org/package/request) module returns it.

*The sendEmail method also be  provided in all lowercase as `sendemail` for backwards compatibility.*

## client.sendRawEmail(options, function (err, data, res))

Sends an email message, with header and content specified by the client. The SendRawEmail action is useful for sending multipart MIME emails. The raw text of the message must comply with Internet email standards; otherwise, the message cannot be sent.

There are several important points to know about SendRawEmail:

 * You can only send email from verified email addresses and domains; otherwise, you will get an "Email address not verified" error. If your account is still in the Amazon SES sandbox, you must also verify every recipient email address except for the recipients provided by the Amazon SES mailbox simulator. For more information, go to the [Amazon SES Developer Guide](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-addresses-and-domains.html).
 * The total size of the message cannot exceed 10 MB. This includes any attachments that are part of the message.
 * Amazon SES has a limit on the total number of recipients per message. The combined number of To:, CC: and BCC: email addresses cannot exceed 50. If you need to send an email message to a larger audience, you can divide your recipient list into groups of 50 or fewer, and then call Amazon SES repeatedly to send the message to each group.
 * The To:, CC:, and BCC: headers in the raw message can contain a group list. Note that each recipient in a group list counts towards the 50-recipient limit.
For every message that you send, the total number of recipients (To:, CC: and BCC:) is counted against your sending quota - the maximum number of emails you can send in a 24-hour period. For information about your sending quota, go to the [Amazon SES Developer Guide](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/manage-sending-limits.html).


`sendRawEmail` receives an options object with the following properties:

    `from` - email address from which to send (required)
    `rawMessage` - the raw text of the message which includes a header and a body (required)

Within the raw text of the message, the following must be observed:

* The `rawMessage` value must contain a header and a body, separated by a blank line.
* All required header fields must be present.
* Each part of a multipart MIME message must be formatted properly.
* MIME content types must be among those supported by AWS SES. For more information, see the [SES Developer Guide](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/mime-types.html).
* The `rawMessage` content must be base64-encoded, if MIME requires it.

The `sendRawEmail` method transports your message to the AWS SES service. If Amazon
returns an HTTP status code that's less than `200` or greater than or equal to
400, we will callback with an `err` object that is a direct translation of the _Error_ element of aws error response.

See [Error Handling](#error-handling) section below for details on the structure of returned errors.

### Example

```js
var CRLF = '\r\n'
  , ses = require('node-ses')
  , client = ses.createClient({ key: 'key', secret: 'secret' })
  , rawMessage = [
    'From: "Someone" <someone@example.com>',
    'To: "Someone Else" <other@example.com>',
    'Subject: greetings',
    'Content-Type: multipart/mixed;',
    '    boundary="_003_97DCB304C5294779BEBCFC8357FCC4D2"',
    'MIME-Version: 1.0',
    '',
    '--_003_97DCB304C5294779BEBCFC8357FCC4D2',
    'Content-Type: text/plain; charset="us-ascii"',
    'Content-Transfer-Encoding: quoted-printable',
    'Hi brozeph,',
    '',
    'I have attached a code file for you.',
    '',
    'Cheers.',
    '',
    '--_003_97DCB304C5294779BEBCFC8357FCC4D2',
    'Content-Type: text/plain; name="code.txt"',
    'Content-Description: code.txt',
    'Content-Disposition: attachment; filename="code.txt"; size=4;',
    '    creation-date="Mon, 03 Aug 2015 11:39:39 GMT";',
    '    modification-date="Mon, 03 Aug 2015 11:39:39 GMT"',
    'Content-Transfer-Encoding: base64',
    '',
    'ZWNobyBoZWxsbyB3b3JsZAo=',
    '',
    '--_003_97DCB304C5294779BEBCFC8357FCC4D2',
    ''
  ].join(CRLF);

client.sendRawEmail({
 , from: 'someone@example.com'
 , rawMessage: rawMessage
}, function (err, data, res) {
 // ...
});
```

Check for errors returned since a 400 status is not uncommon.

The `data` returned in the callback is an object containing the parsed Amazon json response.

See the [SES API Response](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html) docs for details.

The `res` returned by the callback represents the HTTP response to calling the SES REST API as the [request](https://www.npmjs.org/package/request) module returns it.

<a name="error-handling"></a>
## Error Handling

The errors returned when sending failed are JavaScript objects that correspond to the Error element as seen in [Structure of an Error Response](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/query-interface-responses.html) from the official documentation. The properties in error object we return include:

 * A `Type` element that identifies whether the error was a Receiver, Sender, or NodeSesInternal error
 * A `Code` element that identifies the type of error that occurred
 * A `Message` element that describes the error condition in a human-readable form
 * A `Detail` element that might give additional details about the error or might be empty

An error of Type `NodeSesInternal` is returned in three cases:

 * If the HTTP request to AWS fails so that we don't get a normal response from AWS. The `Code` will be `RequestError` and the `Message` will contain the HTTP request error.
 * If aws error response has invalid schema (Error element is missing), then the `Code` will be set to `XmlError` and the `Message` will contain explanation and the original response.

Example error response:

```json
{
  "Type": "Sender",
  "Code": "ValidationError",
  "Message": "Value null at 'message.subject' failed to satisfy constraint: Member must not be null"
}
```

<a name="debugging"></a>
## Debugging

```bash
# Enable in the shell
DEBUG="node-ses" ./server.js
```

```javascript
// ... or temporarily set in your code before `node-ses` is required.
process.env.DEBUG='node-ses';
```


When debugging, it's useful to inspect the raw HTTP request and response send
to Amazon. These can then checked against Amazon's documentation for the [SendMail](http://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html) API method and the [common errors](http://docs.aws.amazon.com/ses/latest/APIReference/CommonErrors.html) that Amazon might return.

To turn on debugging printed to STDERR, set `DEBUG=node-ses` in the environment before running your script. You can also set `process.env.DEBUG='node-ses';` in your code, before the `node-ses` module is required.

See the [debug module](https://www.npmjs.org/package/debug) docs for more debug output possibilities.

## Running the Tests

Unit tests

 `npm test`

To run the full tests, including actually using the AWS SES REST APIs with your credentials, set the following environment variables:

    # Your SES Key and secret
    NODE_SES_KEY
    NODE_SES_SECRET

    # An email that is both an verified sende that can also receive test emails. Possibly your own email address
    NODE_SES_EMAIL

## See Also

 * [node-ses-any-promise](https://www.npmjs.com/package/node-ses-any-promise) is a fork with a promise-based API.
 * [nodemailer](https://www.npmjs.com/package/nodemailer) has more features, including attachment support. There are many "transport" plugins available for it, including one for SES.

## License

[MIT](https://github.com/aheckmann/node-ses/blob/master/LICENSE)
