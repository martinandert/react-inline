/*
 * @providesModule buildCSS
 */

import autoprefixer from 'autoprefixer-core';
import CleanCSS from 'clean-css';
import objEach from 'objEach';
import transformSpecificationIntoCSS from 'transformSpecificationIntoCSS';

export default function(stylesheets, options) {
  let css = '';

  objEach(stylesheets, (name, stylesheet) => {
    let cssOptions = Object.assign({}, options);
    cssOptions.prefixes = [options.filename, name];

    css += transformSpecificationIntoCSS(stylesheet, cssOptions);
    css += '\n';
  });

  if (css.length === 0) {
    return null;
  }

  const vp = options.vendorPrefixes;

  if (vp) {
    if (typeof vp === 'object') {
      css = autoprefixer(vp).process(css).css;
    } else {
      css = autoprefixer.process(css).css;
    }
  }

  if (options.minify) {
    css = new CleanCSS().minify(css).styles;
  }

  return css;
}
