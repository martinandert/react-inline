/*
 * @providesModule transformSpecificationIntoCSS
 */

import objEach from 'objEach';
import buildCSSRule from 'buildCSSRule';
import generateClassName from 'generateClassName';

export default function transformSpecificationIntoCSS(spec, options = {}) {
  let css = [];

  objEach(spec, (key, value) => {
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
  var rulesCSS = [];

  objEach(rules, (key, value) => {
    rulesCSS.push(indent(level + 1) + buildCSSRule(key, value, options));
  });

  if (rulesCSS.length) {
    css.push(indent(level) + '.' + generateClassName(name, options) + ' {');
    Array.prototype.push.apply(css, rulesCSS);
    css.push(indent(level) + '}');
  }
}

function processPseudoClasses(css, name, pseudoClasses, level, options) {
  if (isEmpty(pseudoClasses)) { return; }

  objEach(pseudoClasses, (key, value) => {
    processRules(css, name + ':' + key, value.rules, level, options);
  });
}

function processMediaQueries(css, name, mediaQueries, level, options) {
  if (isEmpty(mediaQueries)) { return; }

  objEach(mediaQueries, (key, value) => {
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
