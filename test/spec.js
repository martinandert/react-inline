import assert from 'assert';
import os from 'os';
import fs from 'fs';
import path from 'path';
import util from 'util';
import rimraf from 'rimraf';

var StyleSheet  = require('../');
var Bundler     = require('../bundler');
var Extractor   = require('../extractor');

describe('StyleSheet.create', () => {
  it('returns its first argument', () => {
    assert.strictEqual(StyleSheet.create('foo'), 'foo');
  });
});

describe('Bundler.bundle', () => {
  it('concatenates files', () => {
    const srcDir      = 'test/fixtures/bundler';
    const filename    = '../../../tmp/test/bundler/bundle.css';
    const bundlePath  = path.join(srcDir, filename);
    const bundleDir   = path.dirname(bundlePath);

    rimraf.sync(bundleDir);

    Bundler.bundle(srcDir, filename, {});

    assert(fs.existsSync(bundlePath));

    const bundleCSS = fs.readFileSync(bundlePath, { encoding: 'utf8' });

    assert(bundleCSS.indexOf('.foo') > -1);
    assert(bundleCSS.indexOf('.bar') > -1);
    assert(bundleCSS.indexOf('.baz') > -1);
  });

  it('puts the bundle in the source dir by default', () => {
    const srcDir = 'test/fixtures/bundler';
    const bundlePath = path.join(srcDir, 'bundle.css');

    if (fs.existsSync(bundlePath)) {
      fs.unlinkSync(bundlePath);
    }

    Bundler.bundle(srcDir);

    assert(fs.existsSync(bundlePath));

    const bundleCSS = fs.readFileSync(bundlePath, { encoding: 'utf8' });

    assert(bundleCSS.indexOf('.foo') > -1);
    assert(bundleCSS.indexOf('.bar') > -1);
    assert(bundleCSS.indexOf('.baz') > -1);

    fs.unlinkSync(bundlePath);
  });
});

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
    let code = 'var styles = Style.create({ foo: { margin: 0 } });';

    const css = testTransformed({ from: code, to: code });

    assert.strictEqual(css, null);
  });

  it('throws if return value of "StyleSheet.create" call is not assigned to a variable', () => {
    assert.throws(() => {
      testTransformed({
        from: `
          <div style={styles.foo} />;

          StyleSheet.create({ foo: { margin: 0 } });
        `, to: `
          <div style={styles.foo} />;

          StyleSheet.create({ foo: { margin: 0 } });
        `
      });
    }, /must be assigned to a variable/);
  });

  it('returns null css property if empty stylesheet provided', () => {
    const css = testTransformed({
      from: 'var styles = StyleSheet.create({});',
      to:   'var styles = {};'
    });

    assert.strictEqual(css, null);
  });

  it('works without options argument', () => {
    assert.doesNotThrow(() => {
      transform('var foo = "bar";')
    });
  });

  it('works without a filename option', () => {
    const css = testTransformed({
      from: 'var styles = StyleSheet.create({ foo: { margin: 0 } });',
      to:   'var styles = { foo: "unknown-styles-foo" };',
      options: { filename: undefined } });

    assert(css.indexOf('.unknown-styles-foo') > -1);
  });

  it('works with StyleSheet["create"](...)', () => {
    const css = testTransformed({
      from: 'var styles = StyleSheet["create"]({ foo: { content: "x" } });',
      to:   'var styles = { foo: "test-styles-foo" };'
    });

    testStyleRule(css, 'test-styles-foo', 'content: \'x\'');
  });

  describe('with compressClassNames option set to true', () => {
    var {clearCache} = require('../lib/compressClassName');

    beforeEach(() => {
      clearCache({});
      clearCache({ cacheDir: os.tmpdir() });
    });

    it('compresses class names with memory cache', () => {
      const css = testTransformed({
        from: `
          var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
        `,
        to: `
          var styles1 = { foo: "_0", bar: "_1" };
          var styles2 = { xyz: "_2" };
        `,
        options: {
          compressClassNames: true
        }
      });

      testStyleRule(css, '_0', 'margin: 0');
      testStyleRule(css, '_1', 'padding: 0');
      testStyleRule(css, '_2', 'padding: 10');
    });

    it('compresses class names with disk cache', () => {
      const css = testTransformed({
        from: `
          var styles1 = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });
          var styles2 = StyleSheet.create({ xyz: { padding: 10 } });
        `,
        to: `
          var styles1 = { foo: "_0", bar: "_1" };
          var styles2 = { xyz: "_2" };
        `,
        options: {
          compressClassNames: true,
          cacheDir: os.tmpdir()
        }
      });

      testStyleRule(css, '_0', 'margin: 0');
      testStyleRule(css, '_1', 'padding: 0');
      testStyleRule(css, '_2', 'padding: 10');
    });
  });

  describe('with vendorPrefixes option set to true', () => {
    it('adds vendor prefixes', () => {
      const css = testTransformed({
        from: 'var styles = StyleSheet.create({ foo: { flex: 1 } });',
        to:   'var styles = { foo: "test-styles-foo" };',
        options: { vendorPrefixes: true }
      });

      testStyleRule(css, 'test-styles-foo', 'flex: 1');
      testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
      testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
    });
  });

  describe('with vendorPrefixes option set to an object', () => {
    it('adds vendor prefixes', () => {
      const css = testTransformed({
        from: 'var styles = StyleSheet.create({ foo: { flex: 1 } });',
        to:   'var styles = { foo: "test-styles-foo" };',
        options: { vendorPrefixes: { remove: false } }
      });

      testStyleRule(css, 'test-styles-foo', 'flex: 1');
      testStyleRule(css, 'test-styles-foo', '-webkit-flex: 1');
      testStyleRule(css, 'test-styles-foo', '-ms-flex: 1');
    });
  });

  describe('with minify option set to true', () => {
    it('minifies css', () => {
      const css = testTransformed({
        from: 'var styles = StyleSheet.create({ foo: { margin: 0 }, bar: { padding: 0 } });',
        to:   'var styles = { foo: "test-styles-foo", bar: "test-styles-bar" };',
        options: { minify: true }
      });

      assert.equal(css, '.test-styles-foo{margin:0}.test-styles-bar{padding:0}');
    });
  });

  describe('with filename option provided', () => {
    it('respects filename when generating class names', () => {
      const css = testTransformed({
        from: 'var styles = StyleSheet.create({ foo: { margin: 0 } });',
        to:   'var styles = { foo: "x_y_js-styles-foo" };',
        options: { filename: 'x/y.js' }
      });

      testStyleRule(css, 'x_y_js-styles-foo', 'margin: 0');
    });
  });
});

describe('Extractor.transformFileSync', () => {
  it('works without options argument', () => {
    const {code, css} = Extractor.transformFileSync('test/fixtures/Button.js');

    assert(typeof code === 'string');
    assert(typeof css === 'string');
  });

  it('works with options argument', () => {
    const {code, css} = Extractor.transformFileSync('test/fixtures/Button.js', { vendorPrefixes: true });

    assert(typeof code === 'string');
    assert(typeof css === 'string');
  });
});

describe('Extractor.transformFile', () => {
  it('works without options argument', (done) => {
    Extractor.transformFile('test/fixtures/Button.js', (err, result) => {
      assert(typeof result.code === 'string');
      assert(typeof result.css === 'string');

      done();
    });
  });

  it('works with options argument', (done) => {
    Extractor.transformFile('test/fixtures/Button.js', { foo: 'bar' }, (err, result) => {
      assert(typeof result.code === 'string');
      assert(typeof result.css === 'string');

      done();
    });
  });

  it('calls back on read file error', (done) => {
    Extractor.transformFile('missing.js', (err) => {
      assert(err);
      done();
    });
  });

  it('calls back on transformation error', (done) => {
    Extractor.transformFile('test/fixtures/invalid.js', (err) => {
      assert(err);
      done();
    });
  });
});

describe('Extractor.transformObjectExpressionIntoStyleSheetObject', () => {
  var transform = Extractor.transformObjectExpressionIntoStyleSheetObject;
  var babel = require('babel-core');

  function makeObjectExpression(source) {
    return babel.transform('var expr = ' + source).ast.program.body[0].declarations[0].init;
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
    testValidInput('{ ["foo"]: {} }', { foo: {} });
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

    testInvalidInput('{ [null]: {} }',  /key must be a string or identifier/);
    testInvalidInput('{ [123]: {} }',   /key must be a string or identifier/);
    testInvalidInput('{ [true]: {} }',  /key must be a string or identifier/);
    testInvalidInput('{ [false]: {} }', /key must be a string or identifier/);
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
        selectors: {},
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
        selectors: {
          ':hover': {
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
        selectors: {
          ':hover': {
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
        selectors: {
          ':hover': {
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
        selectors: {
          ':hover': {
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
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
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
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
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
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {}
          }
        }
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
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              }
            }
          }
        }
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
        selectors: {},
        mediaQueries: {
          media: {
            rules: {
              color: 'red',
              padding: 10
            },
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        }
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
        selectors: {
          ':hover': {
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
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  margin: 1,
                  padding: 5
                }
              }
            }
          }
        }
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
            padding: 5,
            ':active': {
              color: 'red',
              padding: 10
            }
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
        selectors: {
          ':hover': {
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
            selectors: {
              ':hover': {
                rules: {
                  color: 'blue',
                  padding: 5
                }
              },
              ':hover:active': {
                rules: {
                  color: 'red',
                  padding: 10
                }
              }
            }
          }
        }
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        ':hover': {
          color: 'black',
          margin: 1,
          ':active': {
            color: 'white'
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          ':hover': {
            rules: {
              color: 'black',
              margin: 1
            }
          },
          ':hover:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      foo: {
        color: 'green',
        padding: 15,
        '[disabled]': {
          color: 'black',
          margin: 1,
          ':active': {
            color: 'white'
          }
        }
      }
    }, {
      foo: {
        rules: {
          color: 'green',
          padding: 15
        },
        selectors: {
          '[disabled]': {
            rules: {
              color: 'black',
              margin: 1
            }
          },
          '[disabled]:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      'foo[disabled]': {
        color: 'green',
        padding: 15,
        ':active': {
          color: 'white'
        }
      }
    }, {
      foo: {
        rules: {
        },
        selectors: {
          '[disabled]': {
            rules: {
              color: 'green',
              padding: 15
            }
          },
          '[disabled]:active': {
            rules: {
              color: 'white'
            }
          }
        },
        mediaQueries: {}
      }
    });

    testValidInput({
      'foo[disabled]:active': {
        color: 'green',
        padding: 15
      }
    }, {
      foo: {
        rules: {
        },
        selectors: {
          '[disabled]:active': {
            rules: {
              color: 'green',
              padding: 15
            }
          }
        },
        mediaQueries: {}
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
        selectors: {
          ':first-child': {
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
            selectors: {
              ':focus': {
                rules: {
                  cursor: 'pointer',
                  fontSize: 12
                }
              },
              ':hover': {
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
            selectors: {
              ':focus': {
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
        selectors: {
          ':hover': {
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
        selectors: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {
              color: 'red'
            },
            selectors: {}
          }
        }
      },
      bam: {
        rules: {},
        selectors: {},
        mediaQueries: {
          'media only screen and (min-width: 120px)': {
            rules: {},
            selectors: {
              ':active': {
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
    testInvalidInput({ '@media': { foo: { ':focus': { 'bar:hover': {} } } } },  /styles cannot be nested into each other/);

    testInvalidInput({ '@media1': { '@media2': {} } },                        /media queries cannot be nested into each other/);
    testInvalidInput({ '@media1': { foo: { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { '@media2': {} } } },               /media queries cannot be nested into each other/);
    testInvalidInput({ foo: { '@media1': { ':hover': { '@media2': {} } } } }, /media queries cannot be nested into each other/);

    testInvalidInput({ foo: { ':hover': { '@media': {} } } }, /media queries cannot be nested into selectors/);
    testInvalidInput({ 'foo:hover': { '@media': {} } },       /media queries cannot be nested into selectors/);

    testInvalidInput({ foo: { bar: {} } },                /value must be a number or a string/);
    testInvalidInput({ foo: { ':hover': { bar: {} } } },  /value must be a number or a string/);
    testInvalidInput({ foo: { '@media': { bar: {} } } },  /value must be a number or a string/);

    testInvalidInput({ ':hover': {} },                /stand-alone selectors are not allowed at the top-level/);
    testInvalidInput({ '@media1': { ':hover': {} } }, /stand-alone selectors are not allowed in top-level media queries/);

    testInvalidInput({ 'foo bar': {} },     /style name is invalid/);
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
        selectors: {
          ':hover': {
            rules: {
              margin: 10,
              padding: '0 20px'
            }
          },
          ':first-child': {
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
            selectors: {
              ':hover': {
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
        selectors: {
          ':hover': {
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
        selectors: {
          ':hover': {
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

  it('ignores empty media queries', () => {
    testCSS({
      foo: {
        rules: {
          margin: 0
        },
        mediaQueries: {
          'media1': {
            rules: {
              margin: 1
            }
          },
          'media2': {
            rules: {

            }
          }
        }
      }
    }, css`
      .foo {
        margin: 0px;
      }
      @media1 {
        .foo {
          margin: 1px;
        }
      }
    `);
  });

  it('ignores unused styles when ignoreUnused options is present', () => {
    testCSS({
      foo: {
        used: true,
        rules: {
          margin: 0
        }
      },
      bar: {
        rules: {
          padding: 0
        }
      }
    }, css`
      .foo {
        margin: 0px;
      }
    `, {
      ignoreUnused: true
    });
  });
});
