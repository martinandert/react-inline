BIN = ./node_modules/.bin
COMMONIZE_OPTIONS = --relativize --follow-requires --ignore-dependencies --ignore-node-core --cache-dir tmp/cache/commoner src/ lib/ StyleSheet InlineStylesExtractor

test: lint commonize
	@$(BIN)/mocha -t 5000 -b -R spec test/spec.js

lint:
	@true

commonize: node_modules/
	@bin/commonize $(COMMONIZE_OPTIONS)

lib/: node_modules/
	@bin/commonize $(COMMONIZE_OPTIONS)

node_modules/:
	@npm install

watch:
	@bin/commonize --watch $(COMMONIZE_OPTIONS)

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

.PHONY: test lint commonize watch clean distclean release-patch release-minor release-major publish
