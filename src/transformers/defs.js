/*
 * @providesModule defsTransformer
 */

import assert from 'assert';
import { Transformer, types as t } from 'babel-core';

import transformObjectExpressionIntoStyleSheetObject from 'transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from 'transformStyleSheetObjectIntoSpecification';

export default function(stylesheets, options) {
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
};
