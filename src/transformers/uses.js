/*
 * @providesModule usesTransformer
 */

import assert from 'assert';
import { Transformer, types as t } from 'babel-core';

import generateClassName from 'generateClassName';

export default function(stylesheets, options = {}) {
  return new Transformer('react-inline-uses', {
    MemberExpression(node) {
      const info = evaluateExpression(this, stylesheets);
      info && extractInlineStyle(this, info, options);
    }
  });
};

function evaluateExpression(path, stylesheets) {
  const node = path.node;

  if (!t.isIdentifier(node.object) || !t.isIdentifier(node.property)) {
    return;
  }

  const sheetId = node.object.name;
  const sheet = stylesheets[sheetId];

  if (!sheet) {
    return;
  }

  const styleId = node.property.name;
  const style = sheet[styleId];

  if (!style) {
    return;
  }

  const containment = getStyleContainment(path);

  if (!containment) {
    return;
  }

  return { sheetId, sheet, styleId, style, containment };
}

function getStyleContainment(path) {
  const p = path.parentPath;
  const pp = p && p.parentPath;
  const ppp = pp && pp.parentPath;
  const pppp = ppp && ppp.parentPath;

  if (t.isJSXExpressionContainer(p.node) && t.isJSXAttribute(pp.node) && t.isJSXIdentifier(pp.node.name, { name: 'style' })) {
    return t.isJSXOpeningElement(ppp.node) && { mode: 'jsx-singleton', node: ppp.node };
  } else if (t.isArrayExpression(p.node) && t.isJSXExpressionContainer(pp.node) && t.isJSXAttribute(ppp.node) && t.isJSXIdentifier(ppp.node.name, { name: 'style' })) {
    return t.isJSXOpeningElement(pppp.node) && { mode: 'jsx-array-element', node: pppp.node };
  }

  return null;
}

function extractInlineStyle(path, info, options) {
  info.style.used = true;

  let gcnOptions = Object.assign({}, options);
  gcnOptions.prefixes = [options.filename, info.sheetId];

  const className = generateClassName(info.styleId, gcnOptions);

  const element = info.containment.node;
  const attributes = element.attributes;

  let newAttributes = [];
  let classNameFound = false;

  attributes.forEach((attribute) => {
    let value;

    switch (attribute.name.name) {
      case 'style':
        value = attribute.value.expression;

        if (value === path.node) {
          // we found our style, but do nothing, because it is
          // later on appended to the className attribute
        } else if (t.isArrayExpression(value)) {
          var newElements = [];

          value.elements.forEach((element) => {
            if (element !== path.node) {
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
            if (argument !== path.node) {
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
