BIN = ./node_modules/.bin

RIX_CACHE_DIR = tmp/cache/react-inline/
RIX_OPTIONS = --relativize --follow-requires --ignore-dependencies --ignore-node-core --media-map "phone=media only screen and (max-width: 640px)" --vendor-prefixes --bundle ../public/bundle.css --babelize --cache-dir $(RIX_CACHE_DIR)
RIX_PRODUCTION_OPTIONS = $(RIX_OPTIONS) --compress-class-names --minify

build: node_modules/
	$(BIN)/react-inline-extract $(RIX_OPTIONS) src/ lib/ server client

build-production: node_modules/
	$(BIN)/react-inline-extract $(RIX_PRODUCTION_OPTIONS) src/ lib/ server client

watch: node_modules/
	$(BIN)/react-inline-extract $(RIX_OPTIONS) --watch src/ lib/ server client

webpack: build
	$(BIN)/webpack --debug --output-pathinfo --colors

webpack-production: build-production
	NODE_ENV=production $(BIN)/webpack --colors

run: clean webpack
	node .

run-production: clean webpack-production
	NODE_ENV=production node .

node_modules/:
	npm install

clean:
	@rm -rf lib/ $(RIX_CACHE_DIR) public/bundle.css

distclean: clean
	@rm -rf tmp/ node_modules/

.PHONY: build build-production watch webpack webpack-production run run-production clean distclean
