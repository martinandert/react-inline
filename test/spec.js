import assert    from 'assert';
import util      from 'util';
import fixtures  from './fixtures';
import helpers   from './helpers';
import Extractor from '../extractor';

describe('Extractor.transform', () => {
  var transform = Extractor.transform;
  var babel = require('babel');

  function makeOptions(options) {
    return Object.assign({}, { id: 'test' }, options);
  }

  function testTransform(input, expected, options = {}) {
    var output = transform(babel.transform(input).code, makeOptions(options)).code;

    assert.equal(babel.transform(expected).code, output);
  }

  it('does nothing if no "StyleSheet.create" call is present', () => {
    testTransform(`
      var c = (<div style={styles.foo}/>);
      var styles = { foo: { border: 0 } };
    `, `
      var c = (<div style={styles.foo}/>);
      var styles = { foo: { border: 0 } };
    `);
  });
});

describe('Extractor.transformObjectExpressionIntoStyleSheetObject', () => {
  var transform = Extractor.transformObjectExpressionIntoStyleSheetObject;

  function testValidInput(input, expected) {
    var expr = helpers.makeObjectExpression(input);

    assert.deepEqual(expected, transform(expr));
  }

  function testInvalidInput(input, message) {
    var expr = helpers.makeObjectExpression(input);

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
    assert.deepEqual(expected, transform(input));
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
    assert.equal(expected, transform(spec, options));
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

// describe('The InlineStylesExtractor', function() {
//   beforeEach(function() {
//     Extractor.reset();
//   });

//   it('passes its first test', function() {
//     var source = 'React.createElement("div", { className: "a-class", style: [myStyles.div, { margin: 30 }] }); var myStyles = StyleSheet.create({ div: { padding: 15 } });';

//     var actual   = Extractor.transform("path/to/foo.js", source);
//     var expected = 'React.createElement("div", { className: __cx("a-class", "path_to_foo_js__myStyles__div__1"), style: { margin: 30 } });\nvar __cx = require("classnames");\nvar __assign = require("react/lib/Object.assign");\n';

//     assert.equal(expected, actual);

//     actual   = Extractor.emitBundle();
//     expected = '/************ path/to/foo.js -> myStyles ************/\n\n.path_to_foo_js__myStyles__div__1 {\n  padding: 15px;\n}\n\n';

//     assert.equal(expected, actual);

//     actual    = Extractor.emitBundle({ minify: true });
//     expected  = '.path_to_foo_js__myStyles__div__1{padding:15px}';

//     assert.equal(expected, actual);

//     actual    = Extractor.emitBundle({ minify: true, compressClassNames: true });
//     expected  = '._1{padding:15px}';

//     assert.equal(expected, actual);
//   });

//   it('passes its second test', function() {
//     var result = Extractor.transform(fixtures.one.id, fixtures.one.source);

//     assert.equal(fixtures.one.transformed, result);
//   });

//   it('passes its third test', function() {
//     var result = Extractor.transform(fixtures.one.id, fixtures.one.source, { compressClassNames: true });

//     assert.equal(fixtures.one.transformedAndCompressed, result);
//   });
// });
