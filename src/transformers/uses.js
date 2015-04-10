/*
 * @providesModule usesTransformer
 */

import assert from 'assert';
import { Transformer, types as t } from 'babel-core';

import generateClassName from 'generateClassName';

export default function(stylesheets, options = {}) {
  return new Transformer('react-inline-uses', {
    MemberExpression() {
      const info = evaluateExpression(this, stylesheets);

      if (info) {
        extractInlineStyle(this, info, options);
      }
    }
  });
};

function evaluateExpression(path, stylesheets) {
  const node = path.node;

  if (!t.isIdentifier(node.object) || !t.isIdentifier(node.property)) {
    return null;
  }

  const sheetId = node.object.name;
  const sheet = stylesheets[sheetId];

  if (!sheet) {
    return null;
  }

  const styleId = node.property.name;
  const style = sheet[styleId];

  if (!style) {
    return null;
  }

  const containment = getStyleContainment(path);

  if (!containment) {
    return null;
  }

  return { sheetId, sheet, styleId, style, ...containment };
}

function getStyleContainment(path) {
  const p = path.parentPath;
  const pp = p && p.parentPath;
  const ppp = pp && pp.parentPath;
  const pppp = ppp && ppp.parentPath;

  if (t.isJSXExpressionContainer(p.node) && t.isJSXAttribute(pp.node) && t.isJSXIdentifier(pp.node.name, { name: 'style' })) {
    return t.isJSXOpeningElement(ppp.node) && { mode: 'JSX', container: ppp.node };
  } else if (t.isProperty(p.node) && t.isIdentifier(p.node.key, { name: 'style' })) {
    return t.isObjectExpression(pp.node) && { mode: 'Hash', container: pp.node };
  } else if (t.isArrayExpression(p.node)) {
    if (t.isJSXExpressionContainer(pp.node) && t.isJSXAttribute(ppp.node) && t.isJSXIdentifier(ppp.node.name, { name: 'style' })) {
      return t.isJSXOpeningElement(pppp.node) && { mode: 'JSX', container: pppp.node };
    } else if (t.isProperty(pp.node) && t.isIdentifier(pp.node.key, { name: 'style' })) {
      return t.isObjectExpression(ppp.node) && { mode: 'Hash', container: ppp.node };
    }
  }

  return null;
}

function extractInlineStyle(path, info, options) {
  info.style.used = true;

  let gcnOptions = Object.assign({}, options);
  gcnOptions.prefixes = [options.filename, info.sheetId];

  const className = generateClassName(info.styleId, gcnOptions);

  switch (info.mode) {
    case 'JSX':
      extractInlineStyleFromJSX(path.node, info.container, className);
      break;

    case 'Hash':
      extractInlineStyleFromHash(path.node, info.container, className);
      break;
  }
}

function extractInlineStyleFromJSX(node, element, className) {
  const attributes = element.attributes;

  let newAttributes = [];
  let classNameFound = false;

  attributes.forEach((attribute) => {
    let value;

    switch (attribute.name.name) {
      case 'style':
        value = attribute.value.expression;

        /*eslint-disable no-empty */
        if (value === node) {
          // we found our style, but do nothing, because it is
          // later on appended to the className attribute

          /*eslint-enable no-empty */
        } else if (t.isArrayExpression(value)) {
          var newElements = [];

          value.elements.forEach((element) => {
            if (element !== node) {
              newElements.push(element);
            }
          });

          switch (newElements.length) {
            case 0:
              // do nothing (removes attribute)
              break;

            case 1:
              newAttributes.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.jSXExpressionContainer(
                    newElements[0]
                  )
                )
              );
              break;

            default:
              newElements.unshift(t.objectExpression([]));

              newAttributes.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.jSXExpressionContainer(
                    t.callExpression(
                      t.identifier('__assign'),
                      newElements
                    )
                  )
                )
              );
              break;
          }
        } else if (t.isCallExpression(value) && value.callee.name === '__assign') {
          var newArguments = [];

          value.arguments.forEach((argument) => {
            if (argument !== node) {
              newArguments.push(argument);
            }
          });

          assert(newArguments.length > 0);

          switch (newArguments.length) {
            case 1:
              // remove prop, because must be the empty object
              break;

            case 2:
              newAttributes.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.jSXExpressionContainer(
                    newArguments[1]
                  )
                )
              );
              break;

            default:
              newAttributes.push(
                t.jSXAttribute(
                  t.identifier('style'),
                  t.jSXExpressionContainer(
                    t.callExpression(
                      t.identifier('__assign'),
                      newArguments
                    )
                  )
                )
              );
              break;
          }
        } else {
          assert(false, 'should never be reached');
        }
        break;

      case 'className':
        value = attribute.value;

        if (t.isJSXExpressionContainer(value)) {
          value = value.expression;

          if (t.isCallExpression(value) && value.callee.name === '__cx') {
            newAttributes.push(
              t.jSXAttribute(
                t.identifier('className'),
                t.jSXExpressionContainer(
                  t.callExpression(
                    t.identifier('__cx'),
                    value.arguments.concat(t.literal(className))
                  )
                )
              )
            );
          } else {
            newAttributes.push(
              t.jSXAttribute(
                t.identifier('className'),
                t.jSXExpressionContainer(
                  t.callExpression(
                    t.identifier('__cx'),
                    [value, t.literal(className)]
                  )
                )
              )
            );
          }
        } else if (t.isLiteral(value)) {
          value = '' + value.value;

          if (value.length) {
            value += ' ' + className;
          } else {
            value = className;
          }

          newAttributes.push(
            t.jSXAttribute(
              t.identifier('className'),
              t.literal(value)
            )
          );
        } else {
          assert(false, `unhandled className value type: ${value.type}`);
        }

        classNameFound = true;
        break;

      default:
        newAttributes.push(attribute);
        break;
    }
  });

  if (!classNameFound) {
    newAttributes.push(
      t.jSXAttribute(
        t.identifier('className'),
        t.literal(className)
      )
    );
  }

  element.attributes = newAttributes;
}

function extractInlineStyleFromHash(node, hash, className) {
  const properties = hash.properties;

  let newProperties = [];
  let classNameFound = false;

  properties.forEach((property) => {
    if (!t.isIdentifier(property.key)) {
      return;
    }

    let value = property.value;

    switch (property.key.name) {
      case 'style':
        /*eslint-disable no-empty */
        if (value === node) {
          // we found our style, but do nothing, because it is
          // later on appended to the className property

          /*eslint-enable no-empty */
        } else if (t.isArrayExpression(value)) {
          var newElements = [];

          value.elements.forEach((element) => {
            if (element !== node) {
              newElements.push(element);
            }
          });

          switch (newElements.length) {
            case 0:
              // do nothing (removes property)
              break;

            case 1:
              newProperties.push(
                t.property(
                  'init',
                  t.identifier('style'),
                  newElements[0]
                )
              );
              break;

            default:
              newElements.unshift(t.objectExpression([]));

              newProperties.push(
                t.property(
                  'init',
                  t.identifier('style'),
                  t.callExpression(
                    t.identifier('__assign'),
                    newElements
                  )
                )
              );
              break;
          }
        } else if (t.isCallExpression(value) && value.callee.name === '__assign') {
          var newArguments = [];

          value.arguments.forEach((argument) => {
            if (argument !== node) {
              newArguments.push(argument);
            }
          });

          assert(newArguments.length > 0);

          switch (newArguments.length) {
            case 1:
              // remove prop, because must be the empty object
              break;

            case 2:
              newProperties.push(
                t.property(
                  'init',
                  t.identifier('style'),
                  newArguments[1]
                )
              );
              break;

            default:
              newProperties.push(
                t.property(
                  'init',
                  t.identifier('style'),
                  t.callExpression(
                    t.identifier('__assign'),
                    newArguments
                  )
                )
              );
              break;
          }
        } else {
          assert(false, 'should never be reached');
        }
        break;

      case 'className':
        if (t.isLiteral(value)) {
          value = '' + value.value;

          if (value.length) {
            value += ' ' + className;
          } else {
            value = className;
          }

          newProperties.push(
            t.property(
              'init',
              t.identifier('className'),
              t.literal(value)
            )
          );
        } else if (t.isCallExpression(value) && value.callee.name === '__cx') {
          newProperties.push(
            t.property(
              'init',
              t.identifier('className'),
              t.callExpression(
                t.identifier('__cx'),
                value.arguments.concat(t.literal(className))
              )
            )
          );
        } else {
          newProperties.push(
            t.property(
              'init',
              t.identifier('className'),
              t.callExpression(
                t.identifier('__cx'),
                [value, t.literal(className)]
              )
            )
          );
        }

        classNameFound = true;
        break;

      default:
        newProperties.push(property);
        break;
    }
  });

  if (!classNameFound) {
    newProperties.push(
      t.property(
        'init',
        t.identifier('className'),
        t.literal(className)
      )
    );
  }

  hash.properties = newProperties;
}
