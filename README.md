**Note:** Thanks to the new possibilities of Babel v6+, there's also my [babel-plugin-css-in-js](https://github.com/martinandert/babel-plugin-css-in-js) project, which works exactly the same but doesn't require a separate CLI/API. If you're using Babel for code transpilation, just put babel-plugin-css-in-js in your build pipeline.

--

# React Inline

[![build status](https://img.shields.io/travis/martinandert/react-inline.svg?style=flat-square)](https://travis-ci.org/martinandert/react-inline)
[![code climate](https://img.shields.io/codeclimate/github/martinandert/react-inline.svg?style=flat-square)](https://codeclimate.com/github/martinandert/react-inline)
[![test coverage](https://img.shields.io/codeclimate/coverage/github/martinandert/react-inline.svg?style=flat-square)](https://codeclimate.com/github/martinandert/react-inline)
[![npm version](https://img.shields.io/npm/v/react-inline.svg?style=flat-square)](https://www.npmjs.com/package/react-inline)

Transform inline styles defined in JavaScript modules into static CSS code and class names so they become available to, e.g. the `className` prop of React elements.

Note: Since v0.5, React Inline is not tied to any specific user interface library, so you don't have to use React to utilize this package. Using it for React components is just a logical consequence.

If you're impatient, [visit the live demo](http://react-inline-demo.martinandert.com/). The source code for it can be found [in the example directory](example/).

Let's dive right into some code. Given the following button component ...

```jsx
import React from 'react';
import StyleSheet from 'react-inline';
import cx from 'classnames';

const { oneOf, bool } = React.PropTypes;

class Button extends React.Component {
  render() {
    const { size, busy, block, className } = this.props;
    const classes = cx(styles.default, styles[size], block && styles.block, className);

    return <button {...this.props} className={classes} disabled={busy} />;
  }
}

Button.propTypes = {
  size:   oneOf(['large', 'small']),
  block:  bool,
  busy:   bool
};

export default Button;

const styles = StyleSheet.create({
  default: {
    padding: '6px 12px',
    fontSize: 14,
    lineHeight: 1.5,
    cursor: 'pointer',
    border: '1px solid #2e6da4',
    borderRadius: 4,
    color: '#fff',
    backgroundColor: '#337ab7',

    '@media only screen and (max-width: 640px)': {
      display: 'block',
      width: '100%'
    },

    ':focus': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#122b40'
    },

    '[disabled]': {
      backgroundColor: '#337ab7',
      borderColor: '#2e6da4',
      cursor: 'not-allowed',
      boxShadow: 'none',
      opacity: .65,
      pointerEvents: 'none'
    }
  },

  large: {
    padding: '10px 16px',
    fontSize: 18,
    lineHeight: 1.33,
    borderRadius: 6
  },

  small: {
    padding: '5px 10px',
    fontSize: 12,
    lineHeight: 1.5,
    borderRadius: 3
  },

  block: {
    display: 'block',
    width: '100%'
  }
});
```

... React Inline turns that into this code ...

```jsx
import React from 'react';
import cx from 'classnames';

const { oneOf, bool } = React.PropTypes;

class Button extends React.Component {
  render() {
    const { size, busy, block, className } = this.props;
    const classes = cx(styles.default, styles[size], block && styles.block, className);

    return <button {...this.props} className={classes} disabled={busy} />;
  }
}

Button.propTypes = {
  size: oneOf(['large', 'small']),
  block: bool,
  busy: bool
};

export default Button;

const styles = {
  default: 'Button-styles-default',
  large: 'Button-styles-large',
  small: 'Button-styles-small',
  block: 'Button-styles-block'
};
```

... and this css:

```css
.Button-styles-default {
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  border: 1px solid #2e6da4;
  border-radius: 4px;
  color: #fff;
  background-color: #337ab7;
}
.Button-styles-default:focus {
  color: #fff;
  background-color: #286090;
  border-color: #122b40;
}
.Button-styles-default[disabled] {
  background-color: #337ab7;
  border-color: #2e6da4;
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.65;
  pointer-events: none;
}
@media only screen and (max-width: 640px) {
  .Button-styles-default {
    display: block;
    width: 100%;
  }
}
.Button-styles-large {
  padding: 10px 16px;
  font-size: 18px;
  line-height: 1.33;
  border-radius: 6px;
}
.Button-styles-small {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 3px;
}
.Button-styles-block {
  display: block;
  width: 100%;
}
```

As you can see, React Inline has support for media queries, pseudo-classes, and attribute selectors.

## Usage

React Inline provides both a Node.js API and a [command line interface](#cli). Typically, the CLI will be all you need. But let's start with the API first because it is the CLI's foundation.


### API

#### `StyleSheet.create(spec)`

In order for React Inline to work, in your components, surround each inline style specification with a `StyleSheet.create` call. This actually does nothing except providing a hook for the extractor.

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

| Option               | Default     | Description                                                                                                                                                                                                                                                                                                                               |
|----------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `filename`           | `"unknown"` | The name of the file for the source to transform. This value is used (in revised form) as a prefix when generating CSS class names.                                                                                                                                                                                                       |
| `vendorPrefixes`     | `false`     | If truthy, the generated CSS is run through [autoprefixer](https://www.npmjs.com/package/autoprefixer) to add vendor prefixes to the rules. If set to an object, it is passed to autoprefixer as `options` argument.                                                                                                                      |
| `minify`             | `false`     | Set to `true` to enable minification of the generated CSS. The popular [clean-css](https://www.npmjs.com/package/clean-css) package is used for this.                                                                                                                                                                                     |
| `compressClassNames` | `false`     | Set to `true` to shorten/obfuscate generated CSS class names. A class name like `"my_file-my_styles_var-my_name"` will so be converted to, e.g., `"_bf"`.                                                                                                                                                                                 |
| `mediaMap`           | `{}`        | This allows you to define media query shortcuts which are expanded on building the CSS. Example: using `{ phone: "media only screen and (max-width: 640px)" }` as value for this option and a stylesheet spec having `"@phone"` as a key, that key will be translated to `@media only screen and (max-width: 640px)` in the final CSS.    |
| `context`            | `null`      | If set to an object, each identifier found on the right-hand side of a style rule is substituted with the corresponding property value of this object.                                                                                                                                                                                    |
| `cacheDir`           | `null`      | If set to a string value, e.g. `"tmp/cache/"`, the class name cache will be persisted in a file in this directory. Otherwise, an in-memory cache is used.                                                                                                                                                                                 |
| `sourceMapName`      | `null`      | If set to a string value, a source map will be generated with the given name and returned as `map`, e.g. `result.map` in the example above.                                                                                                                                                                                               |

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

Bundler.bundle('lib/', '../public/bundle.css', options);
```

Available options:

| Option         | Default       | Description                                                  |
|----------------|---------------|--------------------------------------------------------------|
| `globPattern`  | `"**/*.css"`  | The glob pattern to use when searching for files to bundle.  |


### CLI

React Inline comes with a command line interface which allows you to extract inline styles, generate CSS files, and bundle them up for all your project's files in one go. The binary installed by npm is called `react-inline-extract`. A shorter alias is available under the name `rix`.

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
  -t, --context <name=path>                Add context item (require'd from path) as name
  -b, --bundle <file>                      Bundle all generated CSS into file (default: "bundle.css")
  -B, --no-bundle                          Disable bundling CSS
  -a, --babelize                           Add a Babel transformation step (configure it with a .babelrc)
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

Here's what you can put inside the parentheses of `StyleSheet.create(...)`.

**Simple Styles**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block'
  },

  myInput: {
    width: '100%',
    // ... etc.
  }
}
```

An inline style is not specified as a string. Instead it is specified with an object whose properties form the CSS ruleset for that style. A property's key is the camelCased version of the rule name, and the value is the rule's value, usually a string.

There's also a shorthand notation for specifying pixel values, see [this React tip](http://facebook.github.io/react/tips/style-props-value-px.html) for more details.

**Pseudo-Classes and Attribute Selectors**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block',
    cursor: 'pointer',

    ':focus': {
      borderColor: '#aaa'
    },

    ':hover': {
      borderColor: '#ddd',

      ':active': {
        borderColor: '#eee'
      }
    },

    '[disabled]': {
      cursor: 'not-allowed',
      opacity: .5,

      ':hover': {
        backgroundColor: 'transparent'
      }
    }
  }
}
```

As you can see, pseudo-classes and attribute selectors can be nested arbitrarily deep. But you don't have to use nesting. Here is the example from above in the un-nested version:

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    backgroundColor: 'lightgray',
    display: 'inline-block',
    cursor: 'pointer'
  },
  'myButton:focus': {
    borderColor: '#aaa'
  },
  'myButton:hover': {
    borderColor: '#ddd'
  },
  'myButton:hover:active': {
    borderColor: '#eee'
  },
  'myButton[disabled]': {
    cursor: 'not-allowed',
    opacity: .5
  },
  'myButton[disabled]:hover': {
    backgroundColor: 'transparent'
  }
}
```

**Media Queries**

```js
{
  myButton: {
    border: 'solid 1px #ccc',
    // ...
  },

  myInput: {
    width: '100%',
    // ...
  },

  '@media only screen and (max-width: 480px)': {
    myButton: {
      borderWidth: 0
    },

    myInput: {
      fontSize: 14
    }
  },

  '@media only screen and (max-width: 768px)': {
    myButton: {
      borderWidth: 2,

      ':hover': {
        borderWidth: 3
      }
    }
  }
}
```

Media queries can appear at the top-level (as shown above) or nested in the style:

```js
{
  myButton: {
    border: 'solid 1px #ccc',

    '@media only screen and (max-width: 480px)': {
      borderWidth: 0,

      ':active': {
        borderColor: 'blue'
      }
    },

    '@media only screen and (max-width: 768px)': {
      // ...
    }
  }
}
```

Given you set `{ phone: 'media only screen and (max-width: 480px)', tablet: 'media only screen and (max-width: 768px)' }` as `mediaMap` option for the transformation, the above spec can be simplified to:

```js
{
  myButton: {
    border: 'solid 1px #ccc',

    '@phone': {
      borderWidth: 0,

      ':active': {
        borderColor: 'blue'
      }
    },

    '@tablet': {
      // ...
    }
  }
}
```

**Expressions in Style Rules**

You can do simple arithmetic and string concats on the right-hand side of style rules. Each identifier found is substituted with the corresponding property value of the `context` object provided as option.

Example for a given context `{ MyColors: { green: '#00FF00' }, myUrl: 'path/to/image.png' }`:

```js
{
  myButton: {
    color: MyColors.green,
    borderWidth: 42 + 'px',
    backgroundImage: 'url(' + myUrl + ')'
  }
}
```

## Installation

Install via npm:

```bash
% npm install react-inline --save-dev
```


## Example

If you just want to see some example output for a file, head over to [this repo's quick example](example/quick/). There you will find the code for a simple button component together with its transformed version and CSS file (both with and without compressed class names).

The code for a more sophisticated example can be found [in the repo's example directory](example/). After cloning this repo, see the example's README for more info on how to run it.


## Caveats

* Just using `var styles = StyleSheet.create(...)` in your React modules and skipping the transformation step won't work. It's the transformation that is responsible for a) generating the real CSS, and b) turning your `StyleSheet.create(...)` calls into object literals holding the CSS class names so you can do `<foo className={styles.bar} />` without breaking React. But you are transpiling your JavaScript anyway to get these cool new ES6 features, aren't you?
* Apart from simple arithmetic and string concats, a stylesheet specification cannot contain advanced dynamic stuff, because although the transformer parses the source input, it is not compiled. If you really need to add truly dynamic styles, that's what the `style` attribute/prop was made for. `style` also has the positive side-effect of taking precedence over class names.
* Writing a gulp/grunt/browserify/webpack/you-name-it plugin for React Inline will be a hard nut to crack. This is due to the fact that in order to properly compress all CSS class names used in a project, the transformer needs some global context in form of a cache holding the generated class names for each file. And such a plugin needs to be isomorphic, i.e. it must produce the same output when transpiling for the client and the server environment.


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
