# Changelog

Tags:

- [New Feature]
- [Bug Fix]
- [Breaking Change]
- [Documentation]
- [Internal]
- [Polish]

## 0.8.1 (November 7, 2015)

- **Bug Fix**
  - Make babel-runtime a dependency

## 0.8.0 (November 7, 2015)

- **New Feature**
  - The CLI now uses Babel v6 for the additional transformation step
- **Breaking Change**
  - Remove the `--babel-stage` CLI option, use a `.babelrc` file to configure the additional Babel transformation step
- **Internal**
  - Transpile code with Babel v6

## 0.7.0 (November 6, 2015)

- **New Feature**
  - Add support for Node.js v4 and v5
- **Breaking Change**
  - Remove support for Node.js v0.10
- **Internal**
  - Remove the Contextify dependency, use built-in VM module instead

## 0.6.4 (November 6, 2015)

- **New Feature**
  - Add `export default` to StyleSheet.js (b6pzeusbc54tvhw5jgpyw8pwz2x6gs)
- **Polish**
  - Remove changelog from npm package

## 0.6.3 (June 23, 2015)

- **Internal**
  - Fix broken release

## 0.6.2 (June 12, 2015)

- **New Feature**
  - Add support for source maps (mjohnston)
- **Internal**
  - Move example away from Heroku
  - Upgrade autoprefixer-core (mjohnston)

## 0.6.1 (May 6, 2015)

- **Internal**
  - Simplify library compilation

## 0.6.0 (April 28, 2015)

- **New Feature**
  - Enable simple arithmetic expressions and string concats on the right-hand side of style rules
  - Add `context` options to Node.js API and CLI
- **Documentation**
  - Add CHANGELOG.md
  - Update README.md
- **Internal**
  - Switch from babel to recast for AST transform

## 0.5.0 (April 20, 2015)

- **New Feature**
  - Remove React dependency
- **Documentation**
  - Update README.md

## 0.4.2 (April 17, 2015)

- **Documentation**
  - Add live demo at http://react-inline-demo.herokuapp.com/
  - Update README.md

## 0.4.1 (April 16, 2015)

- **New Feature**
  - Remove 'react-inline' import/require when transforming
- **Documentation**
  - Update README.md

## 0.4.0 (April 15, 2015)

First public release.
