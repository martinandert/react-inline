BIN = ./node_modules/.bin

SRC_JS = $(shell find src/ -name "*.js")
LIB_JS = $(patsubst src/%.js,lib/%.js,$(SRC_JS))

BABEL_ARGS = --stage 1 --loose all --optional runtime
MOCHA_ARGS = --compilers js:babel-core/register -t 5000 -b -R spec test/spec.js

build: node_modules/ $(LIB_JS)

$(LIB_JS): lib/%.js: src/%.js
	@mkdir -p $(dir $@)
	@$(BIN)/babel $< --out-file $@ $(BABEL_ARGS)

fast: node_modules/
	@$(BIN)/babel src/ --out-dir lib/ $(BABEL_ARGS)

watch: node_modules/
	$(BIN)/babel src/ --out-dir lib/ $(BABEL_ARGS) --watch

lint: node_modules/
	@$(BIN)/eslint src/

test: lint build
	@NODE_ENV=test $(BIN)/mocha $(MOCHA_ARGS)

test-cov: build
	@NODE_ENV=test $(BIN)/istanbul cover $(BIN)/_mocha -- $(MOCHA_ARGS)

node_modules/:
	@npm install

clean:
	@rm -rf lib/ tmp/cache/build/

distclean: clean
	@rm -rf tmp/ node_modules/

release-patch: test
	@$(call release,patch)

release-minor: test
	@$(call release,minor)

release-major: test
	@$(call release,major)

publish:
	git push --tags origin HEAD:master
	npm publish

define release
	npm version $(1) -m 'release v%s'
endef

.PHONY: build fast watch lint test test-cov clean distclean release-patch release-minor release-major publish
