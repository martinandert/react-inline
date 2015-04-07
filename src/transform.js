/*
 * @providesModule transform
 */

import assert       from 'assert';
import recast       from 'recast';
import autoprefixer from 'autoprefixer-core';
import CleanCSS     from 'clean-css';
import objEach      from 'objEach';

import transformObjectExpressionIntoStyleSheetObject from 'transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from 'transformStyleSheetObjectIntoSpecification';
import transformSpecificationIntoCSS from 'transformSpecificationIntoCSS';
import generateClassName from 'generateClassName';

const types = recast.types;
const n     = types.namedTypes;
const b     = types.builders;

const hasStyleSheetCreateCall = /\bStyleSheet\.create\b/;
const postlude = '\n\nvar __cx = require("classnames");\nvar __assign = require("react/lib/Object.assign");\n';

export default function transform(source, options = {}) {
  if (hasStyleSheetCreateCall.test(source)) {
    options = Object.assign({}, options, {
      prefixes: options.id ? [options.id.replace(/[^_a-z0-9-]/ig, '_')] : []
    });

    let stylesheets = {};
    let ast = recast.parse(source);

    ast = transformDefs(ast, stylesheets, options);
    ast = transformUses(ast, stylesheets, options);

    return {
      code: recast.print(ast).code + postlude,
      css:  buildCSS(stylesheets, options)
    };
  }

  return { code: source };
}

function transformDefs(ast, stylesheets, options) {
  return recast.visit(ast, {
    visitCallExpression(path) {
      if (isStyleSheetCreateCall(path)) {
        handleStyleSheetCreateCall(path, stylesheets, options);
      }

      this.traverse(path);
    }
  });
}

function transformUses(ast, stylesheets, options) {
  var names = Object.keys(stylesheets);

  return recast.visit(ast, {
    visitMemberExpression(path) {
      if (hasStyleUsage(path, names)) {
        handleStyleUsage(path, stylesheets, options);
      }

      this.traverse(path);
    }
  });
}

function buildCSS(stylesheets, options) {
  let css = '';

  objEach(stylesheets, (name, stylesheet) => {
    let cssOptions = Object.assign({}, options);
    cssOptions.prefixes = cssOptions.prefixes.concat(name);

    css += transformSpecificationIntoCSS(stylesheet, cssOptions);
    css += '\n';
  });

  const vp = options.vendorPrefixes;

  if (vp) {
    if (typeof vp === 'object') {
      css = autoprefixer(vp).process(css).css;
    } else {
      css = autoprefixer.process(css).css;
    }
  }

  if (options.minify) {
    css = new CleanCSS().minify(css).styles;
  }

  return css;
}

function isStyleSheetCreateCall(path) {
  const node = path.value;

  return (
    n.MemberExpression.check(node.callee) &&
      n.Identifier.check(node.callee.object)   && node.callee.object.name   === 'StyleSheet' &&
      n.Identifier.check(node.callee.property) && node.callee.property.name === 'create'
  );
}

function handleStyleSheetCreateCall(path, stylesheets, options) {
  let variableDeclarationPath = path.parentPath.parentPath.parentPath;

  assert(n.VariableDeclaration.check(variableDeclarationPath.value), 'StyleSheet.create(...) must be assigned to a variable');

  const name = path.parentPath.value.id.name;
  const expr = path.value.arguments[0];

  assert(expr, 'StyleSheet.create(...): missing argument');

  const obj = transformObjectExpressionIntoStyleSheetObject(expr);
  const stylesheet = transformStyleSheetObjectIntoSpecification(obj);

  stylesheets[name] = stylesheet;

  if (options.removeStyleSheetDefinitions) {
    variableDeclarationPath.replace(b.emptyStatement());
  }
}

function hasStyleUsage(path, names) {
  const node = path.value;

  if (names.indexOf(node.object.name) > -1) {
    if (isInStyleProperty(path.parentPath.value)) {
      return true;
    }

    const ppPath = path.parentPath.parentPath;

    if (n.ArrayExpression.check(ppPath.value) && isInStyleProperty(ppPath.parentPath.value)) {
      return true;
    }
  }

  return false;
}

function isInStyleProperty(node) {
  return n.Property.check(node) && n.Identifier.check(node.key) && node.key.name === 'style';
}

// TODO: this function is a mess, needs refactoring
function handleStyleUsage(path, stylesheets, options) {
  const node  = path.value;

  const sheetId = node.object.name;
  const name    = node.property.name;
  const style   = stylesheets[sheetId][name];

  assert(style);

  style.used = true

  let gcnOptions = Object.assign({}, options);
  gcnOptions.prefixes = gcnOptions.prefixes.concat(sheetId);

  const className = generateClassName(name, gcnOptions);

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
