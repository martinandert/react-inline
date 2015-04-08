/*
 * @providesModule Transformers
 */

import assert from 'assert';
import {Transformer, types as t} from 'babel-core';

import transformObjectExpressionIntoStyleSheetObject from 'transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from 'transformStyleSheetObjectIntoSpecification';
import transformSpecificationIntoCSS from 'transformSpecificationIntoCSS';
import generateClassName from 'generateClassName';

babel.transform.transformers = {};
babel.transform.moduleFormatters['common'] = function() {};

class Transformers {
  static defsTransformer(stylesheets, options = {}) {
    return new Transformer('react-inline-defs', {
      CallExpression(node, parent) {
        var callee = node.callee;

        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: 'StyleSheet' }) && t.isIdentifier(callee.property, { name: 'create' })) {
          if (t.isVariableDeclarator(parent, { init: node })) {
            var name = parent.id.name;
            var expr = node.arguments[0];

            assert(expr, 'StyleSheet.create(...) call is missing an argument');

            const obj   = transformObjectExpressionIntoStyleSheetObject(expr);
            const sheet = transformStyleSheetObjectIntoSpecification(obj);

            stylesheets[name] = sheet;

            if (options.removeStyleSheetDefinitions) {
              let ppPath = this.parentPath.parentPath;

              if (t.isVariableDeclaration(ppPath.node)) {
                ppPath.remove();
              }
            }
          } else {
            assert(false, 'result of StyleSheet.create(...) must be assigned to a variable');
          }
        }
      }
    });
  }

  static usesTransformer(stylesheets, options = {}) {
    const names = Object.keys(stylesheets);

    return new Transformer('react-inline-uses', {
      MemberExpression(node, parent) {
        if (hasStyleUsage(this, names)) {
          handleStyleUsage(this, stylesheets, options);
        }
      }
    });
  }
}

function hasStyleUsage(path, names) {
  const node = path.node;

  if (t.isIdentifier(node.object) && names.indexOf(node.object.name) > -1) {
    if (isInStyleProperty(path.parentPath.node)) {
      return true;
    }

    const ppPath = path.parentPath.parentPath;

    if (t.isArrayExpression(ppPath.node) && isInStyleProperty(ppPath.parentPath.node)) {
      return true;
    }
  }

  return false;
}

function isInStyleProperty(node) {
  // return t.isProperty(node) && t.isIdentifier(node.name, { name: 'style' });
  return t.isJSXIdentifier(node.name, { name: 'style' }) && t.isJSXExpressionContainer(node.value);
}

// TODO: this function is a mess, needs refactoring
function handleStyleUsage(path, stylesheets, options) {
  const node  = path.node;

  const sheetId = node.object.name;
  const name    = node.property.name;
  const style   = stylesheets[sheetId][name];

  assert(style);

  style.used = true

  let gcnOptions = Object.assign({}, options);
  gcnOptions.prefixes = gcnOptions.prefixes.concat(sheetId);

  const className = generateClassName(name, gcnOptions);

  var elementPath = path.parentPath;

  while (elementPath && !t.isJSXOpeningElement(elementPath.node)) {
    elementPath = elementPath.parentPath;
  }

  assert(elementPath);

  var propNodes = elementPath.node.attributes;
  var newProps = [];
  var classNameFound = false;

  propNodes.forEach(function(propNode) {
    if (t.isJSXExpressionContainer(propNode.value)) {
      propNode.value = propNode.value.expression;
    }

    switch (propNode.name.name) {
      case 'style':
        if (propNode.value === node) {
          // do nothing
        } else if (t.isArrayExpression(propNode.value)) {
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
                t.jSXAttribute(
                  t.identifier('style'),
                  newElements[0]
                )
              );
              break;

            default:
              newElements.unshift(t.objectExpression([]));

              newProps.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.callExpression(t.identifier('__assign'), newElements)
                )
              );
              break;
          }
        } else if (t.isCallExpression(propNode.value) && propNode.value.callee.name === '__assign') {
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
                t.jSXAttribute(
                  t.identifier('style'),
                  newArguments[1]
                )
              );
              break;

            default:
              newProps.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.callExpression(t.identifier('__assign'), newArguments)
                )
              );
              break;
          }
        } else {
          assert(false, 'should never be reached');
        }

        break;

      case 'className':
        if (t.isCallExpression(propNode.value) && propNode.value.callee.name === '__cx') {
          newProps.push(
            t.jSXAttribute(
              t.identifier('className'),
              t.callExpression(t.identifier('__cx'), propNode.value.arguments.concat(t.literal(className)))
            )
          );
        } else {
          newProps.push(
            t.jSXAttribute(
              t.identifier('className'),
              t.callExpression(t.identifier('__cx'), [propNode.value, t.literal(className)])
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
    newProps.push(t.jSXAttribute(t.identifier('className'), t.literal(className)));
  }

  if (newProps.length) {
    newProps.forEach((newProp) => {
      newProp.value = t.jSXExpressionContainer(newProp.value);
    });

    elementPath.node.attributes = newProps;
  } else {
    elementPath.node.attributes = [];
  }
}
