/*
 * @providesModule transformStyleSheetObjectIntoSpecification
 */

import assert   from 'assert';
import objEach  from 'objEach';

import {isValid as isValidPseudoClass} from 'pseudoClasses';

const isMediaQueryDeclaration = /^@/;
const hasAttachedPseudoClass  = /[^:]+:/;
const isStandalonePseudoClass = /^:/;
const isValidStyleName        = /^.-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;

export default function transformStyleSheetObjectIntoSpecification(content) {
  assertPlainObject(content);

  let styles = {};

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      processMediaQuery(styles, key.substring(1), value);
    } else if (isStandalonePseudoClass.test(key)) {
      assert(false, 'stand-alone pseudo-classes are not allowed at the top-level');
    } else if (hasAttachedPseudoClass.test(key)) {
      var [styleName, pseudoClassName] = key.split(':');
      processStyleAndPseudoClass(styles, styleName, pseudoClassName, value)
    } else {
      processStyle(styles, key, value);
    }
  });

  return styles;
}

function processMediaQuery(styles, mediaQueryName, content) {
  assertPlainObject(content);

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandalonePseudoClass.test(key)) {
      assert(false, 'stand-alone pseudo-classes are not allowed in top-level media queries');
    } else if (hasAttachedPseudoClass.test(key)) {
      var [styleName, pseudoClassName] = key.split(':');
      processStyleAndMediaQueryAndPseudoClass(styles, styleName, mediaQueryName, pseudoClassName, value);
    } else {
      processStyleAndMediaQuery(styles, key, mediaQueryName, value);
    }
  });
}

function processStyle(styles, styleName, content) {
  assertPlainObject(content);

  let style = initStyleSpec(styles, styleName);

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      processStyleAndMediaQuery(styles, styleName, key.substring(1), value);
    } else if (isStandalonePseudoClass.test(key)) {
      processStyleAndPseudoClass(styles, styleName, key.substring(1), value);
    } else if (hasAttachedPseudoClass.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(style.rules, key, value);
    }
  });
}

function processStyleAndMediaQuery(styles, styleName, mediaQueryName, content) {
  assertPlainObject(content);

  let style       = initStyleSpec(styles, styleName);
  let mediaQuery  = initMediaQuerySpec(style.mediaQueries, mediaQueryName);

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandalonePseudoClass.test(key)) {
      processStyleAndMediaQueryAndPseudoClass(styles, styleName, mediaQueryName, key.substring(1), value);
    } else if (hasAttachedPseudoClass.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(mediaQuery.rules, key, value);
    }
  });
}

function processStyleAndPseudoClass(styles, styleName, pseudoClassName, content) {
  assertPlainObject(content);

  let style       = initStyleSpec(styles, styleName);
  let pseudoClass = initPseudoClassSpec(style.pseudoClasses, pseudoClassName);

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into pseudo-classes');
    } else if (isStandalonePseudoClass.test(key)) {
      assert(false, 'pseudo-classes cannot be nested into each other');
    } else if (hasAttachedPseudoClass.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(pseudoClass.rules, key, value);
    }
  });
}

function processStyleAndMediaQueryAndPseudoClass(styles, styleName, mediaQueryName, pseudoClassName, content) {
  assert(isPlainObject(content), 'style value must be a plain object');

  let style       = initStyleSpec(styles, styleName);
  let mediaQuery  = initMediaQuerySpec(style.mediaQueries, mediaQueryName);
  let pseudoClass = initPseudoClassSpec(mediaQuery.pseudoClasses, pseudoClassName)

  objEach(content, (key, value) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandalonePseudoClass.test(key)) {
      assert(false, 'pseudo-classes cannot be nested into each other');
    } else if (hasAttachedPseudoClass.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(pseudoClass.rules, key, value);
    }
  });
}

function processRule(rules, key, value) {
  assert(typeof value === 'string' || typeof value === 'number', 'value must be a number or a string');
  rules[key] = value;
}

function initStyleSpec(styles, name) {
  assert(isValidStyleName.test(name), 'style name is invalid');

  styles[name] = styles[name] || { rules: {}, pseudoClasses: {}, mediaQueries: {} };
  return styles[name];
}

function initMediaQuerySpec(mediaQueries, name) {
  mediaQueries[name] = mediaQueries[name] || { rules: {}, pseudoClasses: {} }
  return mediaQueries[name];
}

function initPseudoClassSpec(pseudoClasses, name) {
  assert(isValidPseudoClass(name), 'pseudo-class name is invalid');

  pseudoClasses[name] = pseudoClasses[name] || { rules: {} };
  return pseudoClasses[name];
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function assertPlainObject(content) {
  assert(isPlainObject(content), 'value must be a plain object');
}
