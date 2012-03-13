
test:
	@./node_modules/.bin/mocha --reporter list $(TESTFLAGS) $(TESTS)

.PHONY: test
