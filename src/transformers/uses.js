/*
 * @providesModule usesTransformer
 */

import { Transformer, types as t } from 'babel-core';

export default function(stylesheets, options) {
  return new Transformer('react-inline-uses', {
    JSXElement(node) {
    }
  });
};
