/*
 * @providesModule InlineStylesExtractor
 */

import fs      from 'fs';
import path    from 'path';
import assert  from 'assert';

import mkdirp      from 'mkdirp';
import recast      from 'recast';
import classnames  from 'classnames';
import CleanCSS    from 'clean-css';

import {isUnitlessNumber} from 'react/lib/CSSProperty';
import hyphenateStyleName from 'react/lib/hyphenateStyleName';

import unsupportedPseudoClasses from 'unsupportedPseudoClasses';

const types = recast.types;
const n     = types.namedTypes;
const b     = types.builders;

const STYLE_REGEX = /StyleSheet\.create/;
const MEDIA_REGEX = /^@media/;
const UNQUOTED_CONTENT_VALUE_REGEX = /^(normal|none|(\b(url\([^)]*\)|chapter_counter|attr\([^)]*\)|(no-)?(open|close)-quote|inherit)((\b\s*)|$|\s+))+)$/;

var styles;

export default { reset, writeBundle, writeBundleSync, emitBundle, transform };

function reset() {
  styles = { classNamesCount: 0, modules: {} };
}

reset();

function writeBundle(filePath, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  mkdirp(path.dirname(filePath), function(err) {
    if (err) {
      callback(err);
      return;
    }

    fs.writeFile(filePath, this.emitBundle(options), callback);
  });
}

function writeBundleSync(filePath, options) {
  mkdirp.sync(path.dirname(filePath));

  fs.writeFileSync(filePath, this.emitBundle(options));
};

function emitBundle(options) {
  options = options || {};

  var source = '';

  for (var moduleId in styles.modules) {
    var module = styles.modules[moduleId];

    for (var sheetId in module) {
      var stylesheet = module[sheetId];

      source += '/************ ' + stylesheet.name + ' ************/\n\n';

      for (var key in stylesheet.spec) {
        var item = stylesheet.spec[key];
        var className = '.' + makeClassName(item.index, item.debugName, options);

        for (var scope in item.scopes) {
          var style = className + ' ' + item.scopes[scope];

          if (scope === '@no-media') {
            source += style + '\n\n';
          } else {
            source += scope + ' {\n';
            source += '  ' + style.replace(/\n/g, '\n  ');
            source += '\n}\n\n';
          }
        }
      }
    }
  }

  if (options.minify) {
    source = new CleanCSS().minify(source).styles;
  }

  return source;
}

function transform(id, source, options = {}) {
  if (STYLE_REGEX.test(source)) {
    var ast = recast.parse(source);

    ast = transformDefs(ast, id);
    ast = transformUses(ast, id, options);

    source = recast.print(ast).code;
    source = source + '\nvar __cx = require("classnames");\nvar __assign = require("react/lib/Object.assign");\n'
  }

  return source;
};

function transformDefs(ast, moduleId) {
  return recast.visit(ast, {
    visitCallExpression(path) {
      var node = path.value;

      if (isStyleDeclaration(node)) {
        var variableDeclarationPath = path.parentPath.parentPath.parentPath;

        assert(n.VariableDeclaration.check(variableDeclarationPath.value));

        var sheetId   = path.parentPath.value.id.name;
        var spec      = getStyleSpecification(node.arguments[0]);
        var debugName = moduleId.replace(/[^a-z0-9_-]/gi, '_') + '__' + sheetId;

        spec = transformStyleSpecification(spec, debugName);

        storeStyleSpecification(spec, moduleId, sheetId);

        variableDeclarationPath.replace(b.emptyStatement());
      }

      this.traverse(path);
    }
  });
}

function makeClassName(index, debugName, options) {
  if (options.compressClassNames) {
    return '_' + index.toString(36).split('').reverse().join('');
  } else {
    return debugName + '__' + index.toString(10);
  }
}

function transformUses(ast, moduleId, options) {
  var vars = Object.keys(styles.modules[moduleId]);

  return recast.visit(ast, {
    visitMemberExpression: function(path) {
      var node = path.value;

      if (isStyleUsage(path, vars)) {
        var spec = styles.modules[moduleId][node.object.name].spec[node.property.name];

        assert(spec);

        var className = makeClassName(spec.index, spec.debugName, options);

        var createElementCall = null;
        var propsPath = path.parentPath;

        while (propsPath && !isReactCreateElementProps(propsPath)) {
          propsPath = propsPath.parentPath;
        }

        assert(propsPath);

        var propNodes = propsPath.value.properties;
        var newProps = [];
        var classNameFound = false;

        propNodes.forEach(function(propNode) {
          switch (propNode.key.name) {
            case 'style':
              if (propNode.value === node) {
                // do nothing
              } else if (n.ArrayExpression.check(propNode.value)) {
                var newElements = [];

                propNode.value.elements.forEach(function(element) {
                  if (element !== node) {
                    newElements.push(element);
                  }
                });

                switch (newElements.length) {
                  case 0:
                    /* remove prop */
                    break;

                  case 1:
                    newProps.push(
                      b.property('init',
                        b.identifier('style'),
                        newElements[0]
                      )
                    );
                    break;

                  default:
                    newElements.unshift(b.objectExpression([]));

                    newProps.push(
                      b.property('init',
                        b.identifier('style'),
                        b.callExpression(b.identifier('__assign'), newElements)
                      )
                    );
                    break;
                }
              } else if (n.CallExpression.check(propNode.value) && propNode.value.callee.name === '__assign') {
                var newArguments = [];

                propNode.value.arguments.forEach(function(argument) {
                  if (argument !== node) {
                    newArguments.push(argument);
                  }
                });

                assert(newArguments.length > 0);

                switch (newArguments.length) {
                  case 1:
                    /* remove prop */
                    break;

                  case 2:
                    newProps.push(
                      b.property('init',
                        b.identifier('style'),
                        newArguments[1]
                      )
                    );
                    break;

                  default:
                    newProps.push(
                      b.property('init',
                        b.identifier('style'),
                        b.callExpression(b.identifier('__assign'), newArguments)
                      )
                    );
                    break;
                }
              } else {
                assert(false, 'should never be reached');
              }

              break;

            case 'className':
              if (n.CallExpression.check(propNode.value) && propNode.value.callee.name === '__cx') {
                newProps.push(
                  b.property('init',
                    b.identifier('className'),
                    b.callExpression(b.identifier('__cx'), propNode.value.arguments.concat(b.literal(className)))
                  )
                );
              } else {
                newProps.push(
                  b.property('init',
                    b.identifier('className'),
                    b.callExpression(b.identifier('__cx'), [propNode.value, b.literal(className)])
                  )
                );
              }
              classNameFound = true;
              break;

            default:
              newProps.push(propNode);
              break;
          }
        });

        if (!classNameFound) {
          newProps.push(b.property('init', b.identifier('className'), b.literal(className)));
        }

        if (newProps.length) {
          propsPath.replace(b.objectExpression(newProps));
        } else {
          propsPath.replace(b.literal('null'));
        }
      }

      this.traverse(path);
    }
  });
}

function isReactCreateElementProps(path) {
  var node = path.value;
  var ppNode = path.parentPath.parentPath.value

  return (
    n.ObjectExpression.check(node) &&
      n.CallExpression.check(ppNode) &&
        n.MemberExpression.check(ppNode.callee) &&
          n.Identifier.check(ppNode.callee.object)   && ppNode.callee.object.name   === 'React' &&
          n.Identifier.check(ppNode.callee.property) && ppNode.callee.property.name === 'createElement'
  );
}

function isStyleDeclaration(node) {
  return (
    n.MemberExpression.check(node.callee) &&
      n.Identifier.check(node.callee.object)   && node.callee.object.name   === 'StyleSheet' &&
      n.Identifier.check(node.callee.property) && node.callee.property.name === 'create'
  );
}

function isInStylesProperty(node) {
  return n.Property.check(node) && n.Identifier.check(node.key) && node.key.name === 'style';
}

function isStyleUsage(path, vars) {
  var node = path.value;

  if (vars.indexOf(node.object.name) > -1) {
    if (isInStylesProperty(path.parentPath.value)) {
      return true;
    }

    if (n.ArrayExpression.check(path.parentPath.parentPath.value) && isInStylesProperty(path.parentPath.parentPath.parentPath.value)) {
      return true;
    }
  }

  return false;
}

function getStyleSpecification(node) {
  var spec = {};

  assert(n.ObjectExpression.check(node), 'The first parameter to StyleSheet.create(...) is not a object');

  node.properties.forEach(function(property) {
    var key = property.key.name || property.key.value;

    assert(n.ObjectExpression.check(property.value), 'The style specification for `' + key + '` is not a object');

    spec[key] = {};

    property.value.properties.forEach(function(subProperty) {
      var subKey = subProperty.key.name;

      if (MEDIA_REGEX.test(key)) {
        assert(n.ObjectExpression.check(subProperty.value), 'The style specification for `' + key + '.' + subKey + '` is not a object');

        spec[key][subKey] = {};

        subProperty.value.properties.forEach(function(subSubProperty) {
          var subSubKey = subSubProperty.key.name;

          assert(n.Literal.check(subSubProperty.value), 'The style specification for `' + key + '.' + subKey + '.' + subSubKey + '` is not a literal');

          spec[key][subKey][subSubKey] = subSubProperty.value.value;
        });
      } else {
        assert(n.Literal.check(subProperty.value), 'The style specification for `' + key + '.' + subKey + '` is not a literal');

        spec[key][subKey] = subProperty.value.value;
      }
    });
  });

  return spec;
}

function transformStyleSpecification(spec, debugName) {
  var result = {};

  for (var key in spec) {
    if (MEDIA_REGEX.test(key)) {
      for (var sheetId in spec[key]) {
        var name = debugName + '__' + sheetId;
        var css = buildCSS(spec[key][sheetId]);

        result[sheetId] = result[sheetId] || { debugName: name, scopes: {} };
        result[sheetId].scopes[key] = css;
      }
    } else {
      var name = debugName + '__' + key;
      var css = buildCSS(spec[key]);

      result[key] = result[key] || { debugName: name, scopes: {} };
      result[key].scopes['@no-media'] = css;
    }
  }

  return result;
}

function storeStyleSpecification(spec, moduleId, sheetId) {
  styles.modules[moduleId] = styles.modules[moduleId] || {};

  styles.modules[moduleId][sheetId] = {
    name: moduleId + ' -> ' + sheetId,
    spec: spec
  };

  for (var key in spec) {
    spec[key].index = ++styles.classNamesCount;
  }
}

function buildCSS(spec) {
  var result = '';

  for (var key in spec) {
    assert(!unsupportedPseudoClasses[key.split('(')[0].trim()], 'Use of pseudo classes is not supported');

    var value = spec[key];

    if (Array.isArray(value)) {
      value.forEach(function(item) {
        result += buildCSSRule(key, item);
      });
    } else {
      result += buildCSSRule(key, value);
    }
  }

  return '{\n' + result + '}';
}

function buildCSSRule(key, value) {
  if (!isUnitlessNumber[key] && typeof value === 'number') {
    value = '' + value + 'px';
  } else if (key === 'content' && !UNQUOTED_CONTENT_VALUE_REGEX.test(value)) {
    value = "'" + value.replace(/'/g, "\\'") + "'";
  }

  return '  ' + hyphenateStyleName(key) + ': ' + value + ';\n';
}
