# React Inline

Inline styles for React components with a transformer to extract them into a CSS bundle.

TODO: Write synopsis.


## Installation

Install via npm:

```bash
% npm install react classnames --save
% npm install react-inline --save-dev
```

Note: [react](https://www.npmjs.com/package/react) and [classnames](https://www.npmjs.com/package/classnames) are peer dependencies of React Inline and will no longer be automatically installed in npm 3+.

If you use React Inline's CLI to transform your styles and set the `--babelize` option, you need to also depend on the [babel-runtime](https://www.npmjs.com/package/babel-runtime) package:

```bash
% npm install babel-runtime --save
```


## Usage

Usage instructions and documentation coming soon.


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
