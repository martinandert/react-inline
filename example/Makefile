BIN = ./node_modules/.bin

REACT_INLINE_CACHE_DIR = tmp/cache/react-inline/
REACT_INLINE_OPTIONS = --relativize --follow-requires --ignore-dependencies --ignore-node-core --cache-dir $(REACT_INLINE_CACHE_DIR) --bundle ../public/bundle.css

build: node_modules/
	$(BIN)/react-inline-extract $(REACT_INLINE_OPTIONS) src/ lib/ server client

watch: node_modules/
	$(BIN)/react-inline-extract $(REACT_INLINE_OPTIONS) --watch src/ lib/ server client

webpack: build
	$(BIN)/webpack --debug --output-pathinfo --colors

run: clean webpack
	node .

node_modules/:
	npm install

clean:
	@rm -rf lib/ $(REACT_INLINE_CACHE_DIR)

distclean: clean
	@rm -rf tmp/ node_modules/

.PHONY: build watch webpack run clean distclean
