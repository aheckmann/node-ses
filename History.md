
1.2.0 / 2016-04-07

[DOCUMENTATION]

 * More detail on the structure of errors that might be returned was added.
   See new Error Handling heading in the README (markstos)

[INTERNALS]

 * Internal errrors are now returned in the same format as AWS errors for consistency.
   This changes the structure of the error returned for the edge cases where the HTTP request to AWS failed
   or we failed to parse the XML of the response. (markstos)

1.1.0 / 2015-08-25
==================

[BUG FIXES]

 * Documented default value of Amazon end point was wrong (#21, #25, imatveev, DelvarWorld)

[NEW FEATURES]
 
 * Start supporting sendRawEmail method. (#20, brozeph)

[INTERNALS]

 * Fixed typo in source code (#24, DelvarWorld)

1.0.2 / 2015-07-23
==================

[DOCUMENTATION]

 * Improved debugging documentation

[INTERNALS]
 
 * Bump dependencies
 * Increase test time-out

1.0.1 / 2015-04-15
==================

[BUG FIXES]

 * We now allow the `cc` or `bcc` fields to be used instead of `to`, mirroring the SES API. (#11, Cellule)

[DOCUMENTATION]

 * Explicitly document format for SES endpoints and clarify that not all AWS regions support SES. (#13, rickwaugh1)
 * We now document that we expect input to be UTF-8 encoded.

[INTERNALS]

  * xml2json dependency with replaced with smaller xml2js dependency. [cromestant](https://github.com/cromestant) and  [markstos](https://github.com/markstos) (#15)
  * Bump dependencies

1.0.0 / 2014-11-06
==================

[THINGS THAT MIGHT BREAK YOUR CODE]

  * The format of SES errors has changed from XML to JavaScript objects. This should fit in more naturally
    with Node.js code, but is not backward compatible if you happened to be parsing the errors before.  [robludwig](https://github.com/robludwig)

[DOCUMENTATION]

  * docs were updated to clarify what the `data` and `res` return values are [markstos](https://github.com/markstos) (#6)

0.0.3 / 2012-08-20
==================

  * fixed; fail gracefully when not connected to the network [jessetane](https://github.com/jessetane) (#3)

0.0.2 / 03-14-2012
==================

  * docs
  * add missing dependency - #1

0.0.1 / 03-13-2012
==================

  * initial release
