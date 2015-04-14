/*
 * @providesModule Extractor
 */

export { default as transformObjectExpressionIntoStyleSheetObject } from 'transformObjectExpressionIntoStyleSheetObject';
export { default as transformStyleSheetObjectIntoSpecification } from 'transformStyleSheetObjectIntoSpecification';
export { default as transformSpecificationIntoCSS } from 'transformSpecificationIntoCSS';

import fs from 'fs';
import { transform as babelize } from 'babel-core';

import transformAST from 'transformAST';
import buildCSS from 'buildCSS';

export function transform(source, options = {}) {
  options.filename = options.filename || 'unknown';

  const tfs = babelize.transformers;
  const cmf = babelize.moduleFormatters.common;

  babelize.transformers = {};
  babelize.moduleFormatters.common = function() {};

  let stylesheets = {};

  const babelOptions = {
    ast: false,
    plugins: [transformAST(stylesheets, options)]
  };

  let code = babelize(source, babelOptions).code;
  let css = buildCSS(stylesheets, options);

  babelize.transformers = tfs;
  babelize.moduleFormatters.common = cmf;

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
