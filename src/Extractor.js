/*
 * @providesModule Extractor
 */

export { default as transformObjectExpressionIntoStyleSheetObject } from 'transformObjectExpressionIntoStyleSheetObject';
export { default as transformStyleSheetObjectIntoSpecification } from 'transformStyleSheetObjectIntoSpecification';
export { default as transformSpecificationIntoCSS } from 'transformSpecificationIntoCSS';

import fs from 'fs';
import { transform as babelize } from 'babel-core';

import defsPlugin from 'defsTransformer';
import usesPlugin from 'usesTransformer';
import buildCSS from 'buildCSS';

const hasStyleSheetCreateCall = /\bStyleSheet\s*\.\s*create\b/;
const hasCx = /__cx\(/;
const hasAssign = /__assign\(/;

export function transform(source, options = {}) {
  if (!hasStyleSheetCreateCall.test(source)) {
    return { code: source, css: null };
  }

  options.filename = options.filename || 'unknown';

  const tfs = babelize.transformers;
  const cmf = babelize.moduleFormatters['common'];

  babelize.transformers = {};
  babelize.moduleFormatters['common'] = function() {};

  let stylesheets = {};

  const babelOptions = {
    plugins: [
      defsPlugin(stylesheets, options),
      usesPlugin(stylesheets, options)
    ]
  };

  let code = babelize(source, babelOptions).code;
  let css = buildCSS(stylesheets, options);

  if (hasCx.test(code)) {
    code += '\n\nvar __cx = require("classnames");';
  }

  if (hasAssign.test(code)) {
    code += '\n\nvar __assign = require("react/lib/Object.assign");';
  }

  babelize.transformers = tfs;
  babelize.moduleFormatters['common'] = cmf;

  return { code, css };
}

export function transformFile(filename, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  options.filename = filename;

  fs.readFile(filename, function(err, source) {
    if (err) return callback(err);

    let result;

    try {
      result = transform(source, options);
    } catch (err) {
      return callback(err);
    }

    callback(null, result);
  });
}

export function transformFileSync(filename, options = {}) {
  options.filename = filename;

  return transform(fs.readFileSync(filename), options);
}
