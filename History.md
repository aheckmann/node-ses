
2.0.5 / 2017-03-28
==================

[BUG FIXES]

 * sendEmail 'key' option now properly overrides 'key' option given to create() (#43)

2.0.4 / 2017-02-28
==================

[INTERNALS]

 * Add error checking for another case that could cause exceptions to be thrown when AWS has problems. (#42)


2.0.3 / 2016-12-09
===================

[BUG FIXES]

 * Really release fix from 2.0.2 (@lyuzashi)

2.0.2 / 2016-12-05
===================

[BUG FIXES]

 * Fix syntax issue which could break builds in some cases (@otech47)

2.0.1 / 2016-09-28
===================

No code changes.

[INTERNALS]

 * Link to new node-ses-any-promise package, a fork with promise-based API.


2.0.0 / 2016-08-16
==================

There's a major version bump because the internals changed signficantly as part
of switching to version 4 authentication signatures with AWS. The upgrade
is backwards compatible with 1.2 for normal use.

[NEW FEATURES]

 * Add webpack compatibility (cspeer)

[INTERNALS]

 * Switched from using "version 2" AWS authentication signatures to "version 4" for future-proofing. (markstos)
 * Processing the response from AWS has been moved to it's own function. Automated test coverage for it has been added
   and there's now the potential to override how response handling works. For now the function remains undocumented. (markstos)

[BREAKING CHANGES]

 * 'algorithm' property is no longer exported and the option to change it is
   removed. If you are using an alternate algorithm to sign version 4
   Authentication signatures, a pull request is welcome to restore this
   feature. (markstos)


1.2.0 / 2016-04-07
==================

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
