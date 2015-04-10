import assert from 'assert';
import util from 'util';

var Extractor = require('../extractor');

describe('Extractor.transform', () => {
  const transform = Extractor.transform;

  function makeOptions(options) {
    return Object.assign({}, { filename: 'test' }, options);
  }

  function squish(str) {
    return str.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/g, ' ');
  }

  function testTransformed(spec) {
    const options   = makeOptions(spec.options);
    const result    = transform(spec.from, options)
    const actual    = squish(result.code);
    const expected  = squish(spec.to);

    assert.equal(actual, expected);

    return result.css;
  }

  function testStyleRule(css, className, rule) {
    assert(css);

    const hasClassNameWithRule = new RegExp(`\\.${className}\\s*\\{[^\\}]*?${rule}`);

    assert(hasClassNameWithRule.test(css));
  }

  it('does nothing if no "StyleSheet.create" call is present', () => {
    let code = `
      <div style={styles.foo} />;

      var styles = { foo: { margin: 0 } };
    `;

    const css = testTransformed({ from: code, to: code });

    assert.strictEqual(css, null);
  });

  describe('within JSXElement as value of "style" attribute', () => {
    it('converts style prop into className prop', () => {
      const css = testTransformed({
        from: `
          <div style={styles.foo} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          <div className="test-styles-foo" />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('preserves other props', () => {
      const css = testTransformed({
        from: `
          <div ref="x" style={styles.foo} lang="en" />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          <div ref="x" lang="en" className="test-styles-foo" />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with string value', () => {
      const css = testTransformed({
        from: `
          <div className="baz" style={styles.foo} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          <div className="baz test-styles-foo" />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with identifier value', () => {
      const css = testTransformed({
        from: `
          <div className={baz} style={styles.foo} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          <div className={__cx(baz, "test-styles-foo")} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });

          var __cx = require("classnames");
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with function call value', () => {
      const css = testTransformed({
        from: `
          <div className={baz(42)} style={styles.foo} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          <div className={__cx(baz(42), "test-styles-foo")} />;

          var styles = StyleSheet.create({ foo: { margin: 0 } });

          var __cx = require("classnames");
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    describe('with style prop having an array as value', () => {
      it('converts style prop elements to className prop', () => {
        const css = testTransformed({
          from: `
            <div style={ [styles.foo, styles.bar] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className="test-styles-foo test-styles-bar" />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with string value', () => {
        const css = testTransformed({
          from: `
            <div className="baz" style={ [styles.foo, styles.bar] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className="baz test-styles-foo test-styles-bar" />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with identifier value', () => {
        const css = testTransformed({
          from: `
            <div className={baz} style={ [styles.foo, styles.bar] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className={__cx(baz, "test-styles-foo", "test-styles-bar")} />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with function call value', () => {
        const css = testTransformed({
          from: `
            <div className={baz(42)} style={ [styles.foo, styles.bar] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className={__cx(baz(42), "test-styles-foo", "test-styles-bar")} />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles a hash-typed style prop element', () => {
        const css = testTransformed({
          from: `
            <div className={baz(42)} style={ [styles.foo, styles.bar, { boo: 0 }] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className={__cx(baz(42), "test-styles-foo", "test-styles-bar")} style={{ boo: 0 }} />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles a identifier-typed style prop element', () => {
        const css = testTransformed({
          from: `
            <div className={baz(42)} style={ [styles.foo, styles.bar, boo] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className={__cx(baz(42), "test-styles-foo", "test-styles-bar")} style={boo} />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles multiple other style prop elements', () => {
        const css = testTransformed({
          from: `
            <div className={baz(42)} style={ [styles.foo, styles.bar, bam, { boo: 0 }] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className={__cx(baz(42), "test-styles-foo", "test-styles-bar")} style={__assign({}, bam, { boo: 0 })} />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
            var __assign = require("react/lib/Object.assign");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });
    });

    describe('with multiple stylesheets', () => {
      it('places class names in order of appearance', () => {
        const css = testTransformed({
          from: `
            <div className="baz" style={ [styles1.foo, styles2.xyz, styles1.bar, bam] } />;

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          to: `
            <div className="baz test-styles1-foo test-styles2-xyz test-styles1-bar" style={bam} />;

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `
        });

        testStyleRule(css, 'test-styles1-foo', 'margin: 0');
        testStyleRule(css, 'test-styles1-bar', 'padding: 0');
        testStyleRule(css, 'test-styles2-xyz', 'padding: 10');
      });
    });

    describe('with compressClassNames option set to true', () => {
      var {clearCache} = require('../lib/compressClassName');

      beforeEach(() => {
        clearCache();
      });

      it('compresses class names', () => {
        const css = testTransformed({
          from: `
            <div className="baz" style={ [styles1.foo, styles2.xyz, styles1.bar, bam] } />;

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          to: `
            <div className="baz _0 _1 _2" style={bam} />;

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          options: {
            compressClassNames: true
          }
        });

        testStyleRule(css, '_0', 'margin: 0');
        testStyleRule(css, '_2', 'padding: 0');
        testStyleRule(css, '_1', 'padding: 10');
      });
    });

    describe('with vendorPrefixes option set to true', () => {
      it('adds vendor prefixes', () => {
        const css = testTransformed({
          from: `
            <div style={styles.foo} />;

            var styles = StyleSheet.create({ foo: { flex: 1 } });
          `,
          to: `
            <div className="test-styles-foo" />;

            var styles = StyleSheet.create({ foo: { flex: 1 } });
          `,
          options: {
            vendorPrefixes: true
          }
        });

        testStyleRule(css, 'test-styles-foo', 'flex: 1');
        testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
        testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
      });
    });

    describe('with minify option set to true', () => {
      it('minifies css', () => {
        const css = testTransformed({
          from: `
            <div style={ [styles.foo, styles.bar] } />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            <div className="test-styles-foo test-styles-bar" />;

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          options: {
            minify: true
          }
        });

        assert.equal(css, '.test-styles-foo{margin:0}.test-styles-bar{padding:0}');
      });
    });

    describe('with removeStyleSheetDefinitions option set to true', () => {
      it('removes stylesheet definitions', () => {
        const css = testTransformed({
          from: `
            <div style={styles.foo} />;

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          to: `
            <div className="test-styles-foo" />;
          `,
          options: {
            removeStyleSheetDefinitions: true
          }
        });
      });
    });

    describe('with filename option provided', () => {
      it('respects filename when generating class names', () => {
        const css = testTransformed({
          from: `
            <div style={styles.foo} />;

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          to: `
            <div className="x_y_js-styles-foo" />;

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          options: {
            filename: 'x/y.js'
          }
        });

        testStyleRule(css, 'x_y_js-styles-foo', 'margin: 0');
      });
    });
  });

  describe('within hash as value of "style" key', () => {
    it('converts style prop into className prop', () => {
      const css = testTransformed({
        from: `
          React.createElement('div', { style: styles.foo });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          React.createElement('div', { className: 'test-styles-foo' });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('preserves other props', () => {
      const css = testTransformed({
        from: `
          React.createElement('div', { ref: 'x', style: styles.foo, lang: 'en' });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          React.createElement('div', { ref: 'x', lang: 'en', className: 'test-styles-foo' });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with string value', () => {
      const css = testTransformed({
        from: `
          React.createElement('div', { className: 'baz', style: styles.foo });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          React.createElement('div', { className: 'baz test-styles-foo' });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with identifier value', () => {
      const css = testTransformed({
        from: `
          React.createElement('div', { className: baz, style: styles.foo });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          React.createElement('div', { className: __cx(baz, 'test-styles-foo') });

          var styles = StyleSheet.create({ foo: { margin: 0 } });

          var __cx = require("classnames");
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    it('appends converted style prop to existing className with function call value', () => {
      const css = testTransformed({
        from: `
          React.createElement('div', { className: baz(42), style: styles.foo });

          var styles = StyleSheet.create({ foo: { margin: 0 } });
        `,
        to: `
          React.createElement('div', { className: __cx(baz(42), 'test-styles-foo') });

          var styles = StyleSheet.create({ foo: { margin: 0 } });

          var __cx = require("classnames");
        `
      });

      testStyleRule(css, 'test-styles-foo', 'margin: 0');
    });

    describe('with style prop having an array as value', () => {
      it('converts style prop elements to className prop', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { style: [styles.foo, styles.bar] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: 'test-styles-foo test-styles-bar' });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with string value', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: 'baz', style: [styles.foo, styles.bar] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: 'baz test-styles-foo test-styles-bar' });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with identifier value', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: baz, style: [styles.foo, styles.bar] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: __cx(baz, 'test-styles-foo', 'test-styles-bar') });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('appends converted style prop elements to existing className with function call value', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: baz(42), style: [styles.foo, styles.bar] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: __cx(baz(42), 'test-styles-foo', 'test-styles-bar') });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles a hash-typed style prop element', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: baz(42), style: [styles.foo, styles.bar, { boo: 0 }] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: __cx(baz(42), 'test-styles-foo', 'test-styles-bar'), style: { boo: 0 } });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles a identifier-typed style prop element', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: baz(42), style: [styles.foo, styles.bar, boo] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: __cx(baz(42), 'test-styles-foo', 'test-styles-bar'), style: boo });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });

      it('properly handles multiple other style prop elements', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: baz(42), style: [styles.foo, styles.bar, bam, { boo: 0 }] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: __cx(baz(42), 'test-styles-foo', 'test-styles-bar'), style: __assign({}, bam, { boo: 0 }) });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });

            var __cx = require("classnames");
            var __assign = require("react/lib/Object.assign");
          `
        });

        testStyleRule(css, 'test-styles-foo', 'margin: 0');
        testStyleRule(css, 'test-styles-bar', 'padding: 0');
      });
    });

    describe('with multiple stylesheets', () => {
      it('places class names in order of appearance', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: 'baz', style: [styles1.foo, styles2.xyz, styles1.bar, bam] });

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          to: `
            React.createElement('div', { className: 'baz test-styles1-foo test-styles2-xyz test-styles1-bar', style: bam });

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `
        });

        testStyleRule(css, 'test-styles1-foo', 'margin: 0');
        testStyleRule(css, 'test-styles1-bar', 'padding: 0');
        testStyleRule(css, 'test-styles2-xyz', 'padding: 10');
      });
    });

    describe('with compressClassNames option set to true', () => {
      var {clearCache} = require('../lib/compressClassName');

      beforeEach(() => {
        clearCache();
      });

      it('compresses class names', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { className: 'baz', style: [styles1.foo, styles2.xyz, styles1.bar, bam] });

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          to: `
            React.createElement('div', { className: 'baz _0 _1 _2', style: bam });

            var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
            var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
          `,
          options: {
            compressClassNames: true
          }
        });

        testStyleRule(css, '_0', 'margin: 0');
        testStyleRule(css, '_2', 'padding: 0');
        testStyleRule(css, '_1', 'padding: 10');
      });
    });

    describe('with vendorPrefixes option set to true', () => {
      it('adds vendor prefixes', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { style: styles.foo });

            var styles = StyleSheet.create({ foo: { flex: 1 } });
          `,
          to: `
            React.createElement('div', { className: 'test-styles-foo' });

            var styles = StyleSheet.create({ foo: { flex: 1 } });
          `,
          options: {
            vendorPrefixes: true
          }
        });

        testStyleRule(css, 'test-styles-foo', 'flex: 1');
        testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
        testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
      });
    });

    describe('with minify option set to true', () => {
      it('minifies css', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { style: [styles.foo, styles.bar] });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          to: `
            React.createElement('div', { className: 'test-styles-foo test-styles-bar' });

            var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          `,
          options: {
            minify: true
          }
        });

        assert.equal(css, '.test-styles-foo{margin:0}.test-styles-bar{padding:0}');
      });
    });

    describe('with removeStyleSheetDefinitions option set to true', () => {
      it('removes stylesheet definitions', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { style: styles.foo });

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          to: `
            React.createElement('div', { className: 'test-styles-foo' });
          `,
          options: {
            removeStyleSheetDefinitions: true
          }
        });
      });
    });

    describe('with filename option provided', () => {
      it('respects filename when generating class names', () => {
        const css = testTransformed({
          from: `
            React.createElement('div', { style: styles.foo });

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          to: `
            React.createElement('div', { className: 'x_y_js-styles-foo' });

            var styles = StyleSheet.create({ foo: { margin: 0 } });
          `,
          options: {
            filename: 'x/y.js'
          }
        });

        testStyleRule(css, 'x_y_js-styles-foo', 'margin: 0');
      });
    });
  });
});

describe('Extractor.transformObjectExpressionIntoStyleSheetObject', () => {
  var transform = Extractor.transformObjectExpressionIntoStyleSheetObject;
  var babel = require('babel');

  function makeObjectExpression(source) {
    return babel.transform('var expr = ' + source).ast.program.body[1].declarations[0].init;
  }

  function testValidInput(input, expected) {
    var expr = makeObjectExpression(input);

    assert.deepEqual(transform(expr), expected);
  }

  function testInvalidInput(input, message) {
    var expr = makeObjectExpression(input);

    assert.throws(() => {
      transform(expr);
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput('{}', {});
    testValidInput('{ foo: {} }', { foo: {} });
    testValidInput('{ "foo foo": {} }', { 'foo foo': {} });
    testValidInput('{ foo: { bar: 123 } }', { foo: { bar: 123 } });
    testValidInput('{ foo: { bar: "baz" } }', { foo: { bar: 'baz' } });
    //testValidInput('{ ["foo"]: {} }', { foo: {} });
    testValidInput('{ undefined: {} }', { undefined: {} });
    testValidInput(`{
      foo: {
        'bar': 'baz',
        bam: 123
      },

      'test 1': {
        test2: {
          'test 3': {
            test4: 'test5'
          }
        },

        'test 6': 'test 7',

        test8: {
          'test 9': 'test 10'
        }
      }
    }`, {
      foo: {
        'bar': 'baz',
        bam: 123
      },
      'test 1': {
        test2: {
          'test 3': {
            test4: 'test5'
          }
        },
        'test 6': 'test 7',
        test8: {
          'test 9': 'test 10'
        }
      }
    });
  });

  it('throws on invalid input', () => {
    testInvalidInput('"foo"',     /must be a object expression/);
    testInvalidInput('123',       /must be a object expression/);
    testInvalidInput('[]',        /must be a object expression/);
    testInvalidInput('true',      /must be a object expression/);
    testInvalidInput('false',     /must be a object expression/);
    testInvalidInput('null',      /must be a object expression/);
    testInvalidInput('undefined', /must be a object expression/);

    testInvalidInput('{ foo: "bar" }',  /top-level value must be a object expression/);
    testInvalidInput('{ foo: [] }',     /top-level value must be a object expression/);

    testInvalidInput('{ foo: { bar: null } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: true } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: false } }', /value must be a string or number/);
    testInvalidInput('{ foo: { bar: null } }',  /value must be a string or number/);
    testInvalidInput('{ foo: { bar: "" } }',    /string value cannot be blank/);
    testInvalidInput('{ foo: { bar: "  " } }',  /string value cannot be blank/);

    testInvalidInput('{ foo: { bar: [] } }',        /invalid value expression type/);
    testInvalidInput('{ foo: { bar: Math.PI } }',   /invalid value expression type/);
    testInvalidInput('{ foo: { bar: undefined } }', /invalid value expression type/);

    //testInvalidInput('{ [null]: {} }',  /key must be a string or identifier/);
    //testInvalidInput('{ [123]: {} }',   /key must be a string or identifier/);
    //testInvalidInput('{ [true]: {} }',  /key must be a string or identifier/);
    //testInvalidInput('{ [false]: {} }', /key must be a string or identifier/);
  });
});

describe('Extractor.transformStyleSheetObjectIntoSpecification', () => {
  var transform = Extractor.transformStyleSheetObjectIntoSpecification;

  function testValidInput(input, expected) {
    assert.deepEqual(transform(input), expected);
  }

  function testInvalidInput(input, message) {
    assert.throws(() => {
      transform(input);
    }, message || assert.AssertionError);
  }

  it('transforms valid input properly', () => {
    testValidInput({}, {});

    testValidInput({
      foo: {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {
          color: 'red',
          padding: 10
        },
        pseudoClasses: {},
        mediaQueries: {},
      }
    });

    testValidInput({
      'foo:hover': {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {},
        pseudoClasses: {
          hover: {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      'foo:hover': {
        color: 'red',
        padding: 10
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'red',
          padding: 10
        }
      },
      'foo:hover': {
        color: 'blue',
        font: 'Arial'
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              color: 'blue',
              padding: 10,
              font: 'Arial'
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              color: 'red',
              padding: 10
            }
          }
        },
        mediaQueries: {},
      }
    });

    testValidInput({
      foo: {
        '@media': {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {},
        pseudoClasses: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {}
          }
        },
      }
    });

    testValidInput({
      '@media': {
        foo: {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {},
        pseudoClasses: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {}
          }
        },
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {}
          }
        },
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'blue',
            padding: 5
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {
              hover: {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              }
            }
          }
        },
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'black',
            margin: 1
          }
        },
        'foo:hover': {
          color: 'blue',
          padding: 5
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {
              hover: {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        },
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1
        }
      },
      'foo:hover': {
        color: 'blue',
        padding: 5
      },
      '@media': {
        foo: {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'black',
            margin: 1
          }
        },
        'foo:hover': {
          color: 'blue',
          padding: 5
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              color: 'blue',
              margin: 1,
              padding: 5
            }
          }
        },
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {
              hover: {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        },
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1
        },
        '@media': {
          color: 'red',
          padding: 10,
          ':hover': {
            color: 'blue',
            padding: 5
          }
        }
      },
      'foo:hover': {
        color: 'blue',
        padding: 5
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              color: 'blue',
              margin: 1,
              padding: 5
            }
          }
        },
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            pseudoClasses: {
              hover: {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              }
            }
          }
        },
      }
    });

    testValidInput({
      foo: {
        margin: 0,
        fontFamily: 'Arial,Verdana,sans-serif',
        '@media only screen and (min-width: 120px)': {
          lineHeight: 1.23,
          display: 'block'
        },
        '@media only screen and (min-width: 700px)': {
          lineHeight: 1.53,
          display: 'inline-block',
          ':focus': {
            outline: 'none'
          }
        }
      },
      bar: {
        border: 'solid 1px black',
        padding: 15,

        ':hover': {
          borderColor: '#333',
          color: 'blue'
        }
      },
      'foo:first-child': {
        border: 'none',
        margin: 1
      },
      '@media only screen and (min-width: 120px)': {
        foo: {
          display: 'inline',
          padding: 0,
          ':focus': {
            cursor: 'pointer',
            fontSize: 12
          }
        },
        'foo:hover': {
          margin: 0
        },
        baz: {
          color: 'red'
        },
        'bam:active': {
          color: 'green'
        }
      }
    }, {
      foo: {
        rules: {
          margin: 0,
          fontFamily: 'Arial,Verdana,sans-serif'
        },
        pseudoClasses: {
          'first-child': {
            rules: {
              border: 'none',
              margin: 1
            }
          }
        },
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {
              lineHeight: 1.23,
              display: 'inline',
              padding: 0
            },
            pseudoClasses: {
              focus: {
                rules: {
                  cursor: 'pointer',
                  fontSize: 12
                }
              },
              hover: {
                rules: {
                  margin: 0
                }
              }
            }
          },
          'media only screen and (min-width: 700px)': {
            rules: {
              lineHeight: 1.53,
              display: 'inline-block'
            },
            pseudoClasses: {
              focus: {
                rules: {
                  outline: 'none'
                }
              }
            }
          }
        }
      },
      bar: {
        rules: {
          border: 'solid 1px black',
          padding: 15
        },
        pseudoClasses: {
          hover: {
            rules: {
              borderColor: '#333',
              color: 'blue'
            }
          }
        },
        mediaQueries: {}
      },
      baz: {
        rules: {},
        pseudoClasses: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {
              color: 'red'
            },
            pseudoClasses: {}
          }
        }
      },
      bam: {
        rules: {},
        pseudoClasses: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {},
            pseudoClasses: {
              active: {
                rules: {
                  color: 'green'
                }
              }
            }
          }
        }
      }
    });
  });

  it('throws on invalid input', () => {
    testInvalidInput("foo",     /value must be a plain object/);
    testInvalidInput(123,       /value must be a plain object/);
    testInvalidInput([],        /value must be a plain object/);
    testInvalidInput(true,      /value must be a plain object/);
    testInvalidInput(false,     /value must be a plain object/);
    testInvalidInput(null,      /value must be a plain object/);
    testInvalidInput(undefined, /value must be a plain object/);

    testInvalidInput({ foo: "bar" },                /value must be a plain object/);
    testInvalidInput({ '@media': "bar" },           /value must be a plain object/);
    testInvalidInput({ '@media': { foo: "bar" } },  /value must be a plain object/);
    testInvalidInput({ foo: { '@media': "bar" } },  /value must be a plain object/);

    testInvalidInput({ foo: { 'bar:hover': {} } },                /styles cannot be nested into each other/);
    testInvalidInput({ foo: { '@media': { 'bar:hover': {} } } },  /styles cannot be nested into each other/);
    testInvalidInput({ foo: { ':hover': { 'bar:focus': {} } } },  /styles cannot be nested into each other/);

    testInvalidInput({ '@media1': { '@media2': {} } },                        /media queries cannot be nested into each other/);
    testInvalidInput({ '@media1': { foo: { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { ':hover': { '@media2': {} } } } }, /media queries cannot be nested into each other/);

    testInvalidInput({ foo: { ':hover': { '@media': {} } } }, /media queries cannot be nested into pseudo-classes/);
    testInvalidInput({ 'foo:hover': { '@media': {} } },       /media queries cannot be nested into pseudo-classes/);

    testInvalidInput({ foo: { ':hover': { ':focus': {} } } },               /pseudo-classes cannot be nested into each other/);
    testInvalidInput({ '@media': { 'foo:hover': { ':focus': {} } } },       /pseudo-classes cannot be nested into each other/);
    testInvalidInput({ foo: { '@media': { ':hover': { ':focus': {} } } } }, /pseudo-classes cannot be nested into each other/);

    testInvalidInput({ foo: { bar: {} } },                /value must be a number or a string/);
    testInvalidInput({ foo: { ':hover': { bar: {} } } },  /value must be a number or a string/);
    testInvalidInput({ foo: { '@media': { bar: {} } } },  /value must be a number or a string/);

    testInvalidInput({ ':hover': {} },                /stand-alone pseudo-classes are not allowed at the top-level/);
    testInvalidInput({ '@media1': { ':hover': {} } }, /stand-alone pseudo-classes are not allowed in top-level media queries/);

    testInvalidInput({ 'foo bar': {} },     /style name is invalid/);
    testInvalidInput({ 'foo:bar baz': {} }, /pseudo-class name is invalid/);
  });
});

describe('Extractor.transformSpecificationIntoCSS', () => {
  var transform = Extractor.transformSpecificationIntoCSS;

  function testCSS(spec, expected, options) {
    assert.equal(transform(spec, options), expected);
  }

  function css(str) {
    return str[0].replace(/\n      /g, '\n').trim();
  }

  it('works for rules', () => {
    testCSS({
      foo: {
        rules: {
          fontFamily: 'Arial,Verdana,"Helvetica Neue",sans-serif',
          margin: 10,
          padding: '0 20px'
        }
      },
      bar: {
        rules: {
          border: 'solid 1px black'
        }
      }
    }, css`
      .foo {
        font-family: Arial,Verdana,"Helvetica Neue",sans-serif;
        margin: 10px;
        padding: 0 20px;
      }
      .bar {
        border: solid 1px black;
      }
    `);
  });

  it('works for pseudo-classes', () => {
    testCSS({
      foo: {
        pseudoClasses: {
          hover: {
            rules: {
              margin: 10,
              padding: '0 20px'
            }
          },
          'first-child': {
            rules: {
              marginTop: 0
            }
          }
        }
      }
    }, css`
      .foo:hover {
        margin: 10px;
        padding: 0 20px;
      }
      .foo:first-child {
        margin-top: 0px;
      }
    `);
  });

  it('works for media queries', () => {
    testCSS({
      foo: {
        mediaQueries: {
          'media only screen and (min-width: 500px)': {
            rules: {
              marginTop: 0
            },
            pseudoClasses: {
              hover: {
                rules: {
                  margin: 10,
                  padding: '0 20px'
                }
              }
            }
          },
          'media only screen and (min-width: 1000px)': {
            rules: {
              marginTop: 10
            },
          }
        }
      }
    }, css`
      @media only screen and (min-width: 500px) {
        .foo {
          margin-top: 0px;
        }
        .foo:hover {
          margin: 10px;
          padding: 0 20px;
        }
      }
      @media only screen and (min-width: 1000px) {
        .foo {
          margin-top: 10px;
        }
      }
    `);
  });

  it('allows media query shortcuts through option', () => {
    testCSS({
      foo: {
        mediaQueries: {
          mobile: {
            rules: {
              marginTop: 0
            }
          },
          tablet: {
            rules: {
              marginTop: 10
            },
          },
          'media no-shortcut': {
            rules: {
              marginTop: 20
            },
          }
        }
      }
    }, css`
      @media mobile-sized {
        .foo {
          margin-top: 0px;
        }
      }
      @media tablet-sized {
        .foo {
          margin-top: 10px;
        }
      }
      @media no-shortcut {
        .foo {
          margin-top: 20px;
        }
      }
    `, {
      mediaMap: {
        mobile: 'media mobile-sized',
        tablet: 'media tablet-sized'
      }
    });
  });

  it('respects prefix option', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        pseudoClasses: {
          hover: {
            rules: {
              padding: 0
            }
          }
        }
      }
    }, css`
      .my-prefix-foo {
        margin: 0px;
      }
      .my-prefix-foo:hover {
        padding: 0px;
      }
    `, {
      prefix: 'my-prefix'
    });
  });

  it('respects prefixes option', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        pseudoClasses: {
          hover: {
            rules: {
              padding: 0
            }
          }
        }
      }
    }, css`
      .a-b-foo {
        margin: 0px;
      }
      .a-b-foo:hover {
        padding: 0px;
      }
    `, {
      prefixes: ['a', 'b']
    });
  });

  it('respects compressClassNames option', () => {
    let uncompressed = transform({ foo_bar_baz: { rules: { margin: 0 } } });
    let compressed   = transform({ foo_bar_baz: { rules: { margin: 0 } } }, { compressClassNames: true });

    assert(uncompressed.length);
    assert(compressed.length);

    assert(uncompressed.length > compressed.length);
  });
});
