import assert from 'assert';
import vm from 'vm';
import extend from 'object-assign';
import { print, types } from 'recast';

const n = types.namedTypes;
const isBlank = /^\s*$/;

export default function transformObjectExpressionIntoStyleSheetObject(expr, context) {
  assert(n.ObjectExpression.check(expr), 'must be a object expression');

  context = vm.createContext(extend({}, context));

  context.evaluate = function(node) {
    return vm.runInContext(print(node).code, this);
  };

  let result = {};

  expr.properties.forEach((property) => {
    processTopLevelProperty(property.key, property.value, result, context);
  });

  return result;
}

function processTopLevelProperty(key, value, result, context) {
  const name = keyToName(key);

  assert(n.ObjectExpression.check(value), 'top-level value must be a object expression');

  result[name] = {};

  processProperties(value.properties, result[name], context);
}

function processProperties(properties, result, context) {
  properties.forEach((property) => {
    processProperty(property.key, property.value, result, context);
  });
}

function processProperty(key, value, result, context) {
  const name = keyToName(key);

  if (canEvaluate(value, context)) {
    const val = context.evaluate(value);

    assert(typeof val === 'string' || typeof val === 'number', 'value must be a string or number');

    if (typeof val === 'string') {
      assert(!isBlank.test(val), 'string value cannot be blank');
    }

    result[name] = val;
  } else if (n.ObjectExpression.check(value)) {
    result[name] = {};

    processProperties(value.properties, result[name], context);
  } else if (n.UnaryExpression.check(value) && value.prefix === true && value.operator === '-') {
    assert(n.Literal.check(value.argument), 'invalid unary argument type');

    result[name] = -value.argument.value;
  } else {
    assert(false, 'invalid value expression type');
  }
}

function keyToName(key) {
  assert(n.Identifier.check(key) || n.Literal.check(key) && typeof key.value === 'string', 'key must be a string or identifier');

  return key.name || key.value;
}

function canEvaluate(expr, context) {
  if (n.Literal.check(expr)) {
    return true;
  } else if (n.Identifier.check(expr) && context.hasOwnProperty(expr.name)) {
    return true;
  } else if (n.MemberExpression.check(expr)) {
    return n.Identifier.check(expr.property) && canEvaluate(expr.object, context);
  } else if (n.BinaryExpression.check(expr)) {
    return canEvaluate(expr.left, context) && canEvaluate(expr.right, context);
  }

  return false;
}


