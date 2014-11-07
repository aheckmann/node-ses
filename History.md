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
