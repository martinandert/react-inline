import fs from 'fs';
import { transform as babelize } from 'babel-core';

import defsPlugin from 'defsTransformer';
import usesPlugin from 'usesTransformer';
import buildCSS from 'buildCSS';

export function transform(source, options = {}) {
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

  const code = babelize(source, babelOptions).code;
  const css = buildCSS(stylesheets, options);

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
