jshint:
	@./node_modules/.bin/jshint lib/*.js test/*.js

test:
	@./node_modules/.bin/mocha --reporter list $(TESTFLAGS) $(TESTS)

.PHONY: test
