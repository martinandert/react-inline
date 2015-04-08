BIN = ./node_modules/.bin
COMMONIZE_OPTIONS = --relativize --follow-requires --ignore-dependencies --ignore-node-core --cache-dir tmp/cache/commoner

build: node_modules/
	@bin/build $(COMMONIZE_OPTIONS) src/ lib/ StyleSheet Extractor Bundler

watch: node_modules/
	@bin/build $(COMMONIZE_OPTIONS) --watch src/ lib/ StyleSheet Extractor Bundler

lint:
	@true

test: lint build
	@$(BIN)/mocha --compilers js:babel/register -t 5000 -b -R spec test/spec.js

node_modules/:
	@npm install

clean:
	@rm -rf lib/ tmp/cache/commoner/

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

.PHONY: build watch lint test clean distclean release-patch release-minor release-major publish
