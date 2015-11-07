import assert from 'assert';
import extend from 'object-assign';
import { visit, types } from 'recast';

import transformObjectExpressionIntoStyleSheetObject from './transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from './transformStyleSheetObjectIntoSpecification';
import generateClassName from './generateClassName';

const n = types.namedTypes;
const b = types.builders;

export default function(ast, stylesheets, options) {
  visit(ast, {
    visitCallExpression(path) {
      const node = path.node;
      const parent = path.parentPath.node;

      if (!isStyleSheetCreate(node.callee)) {
        return this.traverse(path);
      }

      assert(
        n.VariableDeclarator.check(parent),
        'return value of StyleSheet.create(...) must be assigned to a variable'
      );

      const sheetId = parent.id.name;
      const expr = node.arguments[0];

      assert(expr, 'StyleSheet.create(...) call is missing an argument');

      const obj   = transformObjectExpressionIntoStyleSheetObject(expr, options.context);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      stylesheets[sheetId] = sheet;

      let gcnOptions = extend({}, options);
      gcnOptions.prefixes = [options.filename, sheetId];

      let properties = [];

      Object.keys(sheet).forEach((styleId) => {
        const className = generateClassName(styleId, gcnOptions);
        const key       = b.identifier(styleId);
        const value     = b.literal(className);
        const property  = b.property('init', key, value);

        properties.push(property);
      });

      path.replace(b.objectExpression(properties));

      return false;
    },

    visitImportDeclaration(path) {
      if (path.node.source.value === 'react-inline') {
        path.prune();
        return false;
      }

      this.traverse(path);
    },

    visitVariableDeclarator(path) {
      if (isRequireReactInline(path.node)) {
        path.prune();
        return false;
      }

      this.traverse(path);
    }
  });
}

function isStyleSheetCreate(node) {
  return n.MemberExpression.check(node) &&
    n.Identifier.check(node.object) && node.object.name === 'StyleSheet' &&
    (n.Identifier.check(node.property) && node.property.name === 'create' ||
    n.Literal.check(node.property) && node.property.value === 'create');
}

function isRequireReactInline(node) {
  return n.Identifier.check(node.id) && node.id.name === 'StyleSheet' &&
    n.CallExpression.check(node.init) &&
    n.Identifier.check(node.init.callee) && node.init.callee.name === 'require' &&
    n.Literal.check(node.init.arguments[0]) && node.init.arguments[0].value === 'react-inline';
}
