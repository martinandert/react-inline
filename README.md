# React Inline

[![build status](https://img.shields.io/travis/martinandert/react-inline.svg?style=flat-square)](https://travis-ci.org/martinandert/react-inline)
[![test coverage](https://img.shields.io/codeclimate/coverage/github/martinandert/react-inline.svg?style=flat-square)](https://codeclimate.com/github/martinandert/react-inline)
[![npm version](https://img.shields.io/npm/v/react-inline.svg?style=flat-square)](https://www.npmjs.com/package/react-inline)

Inline styles for React components with a transformer to extract them into a CSS bundle.

TODO


## Installation

Install via npm:

```bash
% npm install react-inline --save-dev
```

If you use React Inline's CLI to transform your styles and set the `--babelize` option, you need to install the [babel-runtime](https://www.npmjs.com/package/babel-runtime) package as an additional dependency:

```bash
% npm install babel-runtime --save
```


## Usage

### API

#### `StyleSheet.create(spec)`

In order for React Inline to work, in your components, surround each inline style specification with a `StyleSheet.create` call. This actually does nothing except providing a hook for the transformer.

**Example**

```js
var StyleSheet = require('react-inline');

var myStyles = StyleSheet.create({
  // specification goes here...
});
```

The stylesheet specification format is explained [further down](#stylesheet-specification-format).

Note that the return value of `StyleSheet.create(...)` must be assigned to a variable. The name of the variable is used to distinguish multiple `StyleSheet.create` calls within a file.


#### `object Extractor.transform(string source, [object options])`

This is the actual workhorse of React Inline, responsible for finding `StyleSheet.create` calls, parsing the specifications, replacing the calls with class name objects, and generating the "real" CSS.

The function returns an object with a `code` and a `css` property, holding the transformed source and the generated CSS, respectively. If no `StyleSheet.create` call was found in the source or all stylesheet specifications were empty, the `css` property will have the value `null`.

**Example**

```js
var Extractor = require('react-inline/extractor');

var js = "var StyleSheet = require('react-inline'); var React = ...";

var result = Extractor.transform(js, options);

console.log(result.code); // => 'var React = require(...'
console.log(result.css);  // => '.my-style {\n  border: solid 1px red; ...'
```

Available options to pass as second argument:

| Option               | Default     | Description                                                                                                                                                                                                                                                                                                                         |
|----------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `filename`           | `"unknown"` | The name of the file for the source to transform. This value is used (in revised form) as a prefix when generating CSS class names.                                                                                                                                                                                                 |
| `vendorPrefixes`     | `false`     | If truthy, the generated CSS is run through [autoprefixer](https://www.npmjs.com/package/autoprefixer) to add vendor prefixes to the rules. If set to an object, it is passed to autoprefixer as `options` argument.                                                                                                                |
| `minify`             | `false`     | Set to `true` to enable minification of the generated CSS. The popular [clean-css](https://www.npmjs.com/package/clean-css) package is used for this.                                                                                                                                                                               |
| `compressClassNames` | `false`     | Set to `true` to shorten/obfuscate generated CSS class names. A class name like `"my_file-my_styles_var-my_name"` will so be converted to, e.g., `"_bf"`.                                                                                                                                                                             |
| `mediaMap`           | `{}`        | This allows you to define media query shortcuts which are expanded on building the CSS. Example: using `{ phone: "media only screen and (max-width: 640px)" }` as value for this option and a stylesheet spec having `"@phone"` as a key, that key will be translated to `@media only screen and (max-width: 640px)` in the final CSS. |
| `cacheDir`           | `null`      | If set to a string value, e.g. `"tmp/cache/"`, the class name cache will be persisted in a file in this directory. Otherwise, an in-memory cache is used.                                                                                                                                                                                 |


#### `object Extractor.transformFile(string filename, [object options], function callback)`

Asynchronously transforms the contents of a file.

**Example**

```js
var Extractor = require('react-inline/extractor');

Extractor.transformFile('path/to/file.js', options, function(err, result) {
  result; // => { code, css }
});
```

#### `object Extractor.transformFileSync(string filename, [object options])`

Synchronous version of `transformFile`. Returns the transformed contents of the `filename`.

**Example**

```js
var Extractor = require('react-inline/extractor');

Extractor.transformFileSync('path/to/file.js', options); // => { code, css }
```


#### `Bundler.bundle(string sourceDir, string filename = 'bundle.css', [object options])`

Searches for CSS files in `sourceDir`, concatenates their contents, and writes the result to the return value of `path.join(sourceDir, filename)`.

**Example**

```js
var Bundler = require('react-inline/bundler');

Bundler.bundle('src/', '../public/bundle.css', options);
```

Available options:

| Option         | Default       | Description                                                  |
|----------------|---------------|--------------------------------------------------------------|
| `globPattern`  | `"**/*.css"`  | The glob pattern to use when searching for files to bundle.  |


### CLI

React Inline comes with a command line interface which allows you to extract inline styles, generate CSS files and bundling them for your project in one go. The binary installed by npm is called `react-inline-extract`. A shorter alias is available under the name `rix`.

Here's the output of `react-inline-extract --help`:

```
Usage: react-inline-extract [options] <source directory> <output directory> [<module ID> [<module ID> ...]]

Options:

  -h, --help                               output usage information
  -V, --version                            output the version number
  -c, --config [file]                      JSON configuration file (no file or - means STDIN)
  -w, --watch                              Continually rebuild
  -x, --extension <js | coffee | ...>      File extension to assume when resolving module identifiers
  --relativize                             Rewrite all module identifiers to be relative
  --follow-requires                        Scan modules for required dependencies
  --ignore-dependencies                    Ignore modules defined as dependencies in package.json
  --ignore-node-core                       Ignore Node's core modules ('fs', 'events', etc.)
  --use-provides-module                    Respect @providesModules pragma in files
  --cache-dir <directory>                  Alternate directory to use for disk cache
  --no-cache-dir                           Disable the disk cache
  --source-charset <utf8 | win1252 | ...>  Charset of source (default: utf8)
  --output-charset <utf8 | win1252 | ...>  Charset of output (default: utf8)
  -p, --vendor-prefixes                    Add vendor prefixes to generated CSS
  -o, --compress-class-names               Compress class names in generated CSS
  -m, --minify                             Minify generated CSS
  -q, --media-map <name=query>             Add media query shortcut, e.g. "phone=media (max-width: 640px)"
  -b, --bundle <file>                      Bundle all generated CSS into file (default: "bundle.css")
  -B, --no-bundle                          Disable bundling CSS
  -a, --babelize                           Add a Babel transformation step
  -s, --babel-stage <stage>                Set Babel's experimental proposal stage (default: 2)
```

In a single sentence: the command finds modules with the given module identifiers in the source directory and places a transformed copy of each module into the output directory.

**Example**

```bash
$ react-inline-extract --relativize --follow-requires \
                       -pom --bundle ../public/bundle.css \
                       src/ lib/ client server
```

React Inline's CLI is an extension of the [Commoner](https://www.npmjs.com/package/commoner) package. You can find more detailed usage instructions on [Commoner's GitHub page](https://github.com/reactjs/commoner).


## Stylesheet Specification Format

TODO


## Example

TODO


## Caveats

* Just using `var styles = StyleSheet.create(...)` in your React modules and skipping the transformation step won't work. It's the transformation that is responsible for a) generating the real CSS, and b) turning your `StyleSheet.create(...)` calls into object literals holding the CSS class names so you can do `<foo className={styles.bar} />` without breaking React. But you are transpiling your JavaScript anyway to get these cool new ES6 features, aren't you?
* Writing a gulp/grunt/browserify/webpack/you-name-it plugin for React Inline will be a hard nut to crack. This is due to the fact that in order to properly compress all CSS class names used in a project, the transformer needs some global context in form of a cache holding the generated class names for each file. And such a plugin needs to be isomorphic, i.e. it should produce the same output when transpiling for the client and the server environment.


## Contributing

1. Fork it ( https://github.com/martinandert/react-inline )
2. Run `npm install` to install dependencies.
3. Run the tests. We only take pull requests with passing tests, and it's great to know that you have a clean slate: `make test`.
4. Create your feature branch (`git checkout -b my-new-feature`)
5. Add a test for your change. Only refactoring and documentation changes require no new tests. If you are adding functionality or are fixing a bug, we need a test!
6. Make the test pass.
7. Commit your changes (`git commit -am 'add some feature'`)
8. Push to your fork (`git push origin my-new-feature`)
9. Create a new Pull Request


## License

Released under The MIT License.


## Interesting Reads

* https://github.com/facebook/react/pull/2196
* https://github.com/VirtualCSS/planning/issues/1
* http://jsfiddle.net/vjeux/y11txxv9/
* https://github.com/facebook/react-native/tree/master/Libraries/StyleSheet
