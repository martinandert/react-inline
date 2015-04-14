/*
 * @providesModule transformAST
 */

import assert from 'assert';
import { Transformer, types as t } from 'babel-core';

import transformObjectExpressionIntoStyleSheetObject from 'transformObjectExpressionIntoStyleSheetObject';
import transformStyleSheetObjectIntoSpecification from 'transformStyleSheetObjectIntoSpecification';
import generateClassName from 'generateClassName';

export default function(stylesheets, options) {
  return new Transformer('react-inline', {
    CallExpression(node, parent) {
      if (!this.get('callee').matchesPattern('StyleSheet.create')) {
        return;
      }

      assert(
        t.isVariableDeclarator(parent),
        'return value of StyleSheet.create(...) must be assigned to a variable'
      );

      const sheetId = parent.id.name;
      const expr = node.arguments[0];

      assert(expr, 'StyleSheet.create(...) call is missing an argument');

      const obj   = transformObjectExpressionIntoStyleSheetObject(expr);
      const sheet = transformStyleSheetObjectIntoSpecification(obj);

      stylesheets[sheetId] = sheet;

      let gcnOptions = Object.assign({}, options);
      gcnOptions.prefixes = [options.filename, sheetId];

      let properties = [];

      Object.keys(sheet).forEach((styleId) => {
        const className = generateClassName(styleId, gcnOptions);
        const key       = t.identifier(styleId);
        const value     = t.literal(className);
        const property  = t.property('init', key, value);

        properties.push(property);
      });

      this.replaceWith(t.objectExpression(properties));
    }
  });
}
