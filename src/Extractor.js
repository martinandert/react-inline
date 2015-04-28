/*
 * @providesModule Extractor
 */

export { default as transformObjectExpressionIntoStyleSheetObject } from 'transformObjectExpressionIntoStyleSheetObject';
export { default as transformStyleSheetObjectIntoSpecification } from 'transformStyleSheetObjectIntoSpecification';
export { default as transformSpecificationIntoCSS } from 'transformSpecificationIntoCSS';

import fs from 'fs';
import { parse, print } from 'recast';

import transformAST from 'transformAST';
import buildCSS from 'buildCSS';

export function transform(source, options = {}) {
  options.filename = options.filename || 'unknown';

  let stylesheets = {};
  let ast = parse(source);

  transformAST(ast, stylesheets, options);

  const code = print(ast).code;
  const css = buildCSS(stylesheets, options);

  return { code, css };
}

export function transformFile(filename, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options.filename = filename;

  fs.readFile(filename, function(err, source) {
    if (err) {
      return callback(err);
    }

    let result;

    try {
      result = transform(source, options);
    } catch (exc) {
      return callback(exc);
    }

    callback(null, result);
  });
}

export function transformFileSync(filename, options = {}) {
  options.filename = filename;

  return transform(fs.readFileSync(filename), options);
}
