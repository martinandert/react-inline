/*
 * @providesModule transformSpecificationIntoCSS
 */

import foreach from 'foreach';
import buildCSSRule from 'buildCSSRule';
import generateClassName from 'generateClassName';

export default function transformSpecificationIntoCSS(spec, options = {}) {
  let css = [];

  foreach(spec, (value, key) => {
    processStyle(css, key, value, 0, options);
  });

  return css.join('\n');
}

function processStyle(css, name, spec, level, options) {
  if (options.ignoreUnused && !spec.used) {
    return;
  }

  processRules(css, name, spec.rules, level, options);
  processPseudoClasses(css, name, spec.pseudoClasses, level, options);
  processMediaQueries(css, name, spec.mediaQueries, level, options);
}

function processRules(css, name, rules, level, options) {
  if (isEmpty(rules)) { return; }

  css.push(indent(level) + '.' + generateClassName(name, options) + ' {');

  foreach(rules, (value, key) => {
    css.push(indent(level + 1) + buildCSSRule(key, value, options));
  });

  css.push(indent(level) + '}');
}

function processPseudoClasses(css, name, pseudoClasses, level, options) {
  if (isEmpty(pseudoClasses)) { return; }

  foreach(pseudoClasses, (value, key) => {
    processRules(css, name + ':' + key, value.rules, level, options);
  });
}

function processMediaQueries(css, name, mediaQueries, level, options) {
  if (isEmpty(mediaQueries)) { return; }

  foreach(mediaQueries, (value, key) => {
    processMediaQuery(css, name, key, value, level, options);
  });
}

function processMediaQuery(css, name, query, content, level, options) {
  var mediaQueryCSS = [];

  processRules(mediaQueryCSS, name, content.rules, level + 1, options);
  processPseudoClasses(mediaQueryCSS, name, content.pseudoClasses, level + 1, options);

  if (mediaQueryCSS.length) {
    css.push(indent(level) + '@' + generateMediaQueryName(query, options) + ' {');
    Array.prototype.push.apply(css, mediaQueryCSS);
    css.push(indent(level) + '}');
  }
}

function generateMediaQueryName(name, options) {
  if (options.mediaMap) {
    return options.mediaMap[name] || name;
  }

  return name;
}

function indent(level) {
  let result = '';

  for (let i = 0; i < level; i++) {
    result += '  ';
  }

  return result;
}

function isEmpty(obj) {
  return typeof obj !== 'object' || Object.keys(obj).length === 0;
}
