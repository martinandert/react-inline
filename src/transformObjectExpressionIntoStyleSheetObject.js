/*
 * @providesModule transformObjectExpressionIntoStyleSheetObject
 */

import assert from 'assert';
import { types as t } from 'babel-core';

const isBlank = /^\s*$/;

export default function transformObjectExpressionIntoStyleSheetObject(expr) {
  assert(t.isObjectExpression(expr), 'must be a object expression');

  let result = {};

  expr.properties.forEach((property) => {
    processTopLevelProperty(property.key, property.value, result);
  });

  return result;
}

function processTopLevelProperty(key, value, result) {
  const name = keyToName(key);

  assert(t.isObjectExpression(value), 'top-level value must be a object expression');

  result[name] = {};

  processProperties(value.properties, result[name]);
}

function processProperties(properties, result) {
  properties.forEach((property) => {
    processProperty(property.key, property.value, result);
  });
}

function processProperty(key, value, result) {
  const name = keyToName(key);

  if (t.isLiteral(value)) {
    const val = value.value;

    assert(typeof val === 'string' || typeof val === 'number', 'value must be a string or number');

    if (typeof val === 'string') {
      assert(!isBlank.test(val), 'string value cannot be blank');
    }

    result[name] = val;
  } else if (t.isObjectExpression(value)) {
    result[name] = {};

    processProperties(value.properties, result[name]);
  } else {
    assert(false, 'invalid value expression type');
  }
}

function keyToName(key) {
  assert(t.isIdentifier(key) || t.isLiteral(key) && typeof key.value === 'string', 'key must be a string or identifier');

  return key.name || key.value;
}
