/*
 * @providesModule transformStyleSheetObjectIntoSpecification
 */

import assert from 'assert';
import foreach from 'foreach';
import splitSelector from 'splitSelector';

const isMediaQueryDeclaration = /^@/;
const hasAttachedSelector     = /[^:\[]+[:\[]/;
const isStandaloneSelector    = /^[:\[]/;
const isValidStyleName        = /^.-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;

export default function transformStyleSheetObjectIntoSpecification(content) {
  assertPlainObject(content);

  let styles = {};

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      processMediaQuery(styles, key.substring(1), value);
    } else if (isStandaloneSelector.test(key)) {
      assert(false, 'stand-alone selectors are not allowed at the top-level');
    } else if (hasAttachedSelector.test(key)) {
      var [styleName, selectorName] = splitSelector(key);
      processStyleAndSelector(styles, styleName, selectorName, value);
    } else {
      processStyle(styles, key, value);
    }
  });

  return styles;
}

function processMediaQuery(styles, mediaQueryName, content) {
  assertPlainObject(content);

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandaloneSelector.test(key)) {
      assert(false, 'stand-alone selectors are not allowed in top-level media queries');
    } else if (hasAttachedSelector.test(key)) {
      var [styleName, selectorName] = splitSelector(key);
      processStyleAndMediaQueryAndSelector(styles, styleName, mediaQueryName, selectorName, value);
    } else {
      processStyleAndMediaQuery(styles, key, mediaQueryName, value);
    }
  });
}

function processStyle(styles, styleName, content) {
  assertPlainObject(content);

  let style = initStyleSpec(styles, styleName);

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      processStyleAndMediaQuery(styles, styleName, key.substring(1), value);
    } else if (isStandaloneSelector.test(key)) {
      processStyleAndSelector(styles, styleName, key, value);
    } else if (hasAttachedSelector.test(key)) {
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

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandaloneSelector.test(key)) {
      processStyleAndMediaQueryAndSelector(styles, styleName, mediaQueryName, key, value);
    } else if (hasAttachedSelector.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(mediaQuery.rules, key, value);
    }
  });
}

function processStyleAndSelector(styles, styleName, selectorName, content) {
  assertPlainObject(content);

  let style     = initStyleSpec(styles, styleName);
  let selector  = initSelectorSpec(style.selectors, selectorName);

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into selectors');
    } else if (isStandaloneSelector.test(key)) {
      processStyleAndSelector(styles, styleName, selectorName + key, value);
    } else if (hasAttachedSelector.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(selector.rules, key, value);
    }
  });
}

function processStyleAndMediaQueryAndSelector(styles, styleName, mediaQueryName, selectorName, content) {
  assert(isPlainObject(content), 'style value must be a plain object');

  let style       = initStyleSpec(styles, styleName);
  let mediaQuery  = initMediaQuerySpec(style.mediaQueries, mediaQueryName);
  let selector = initSelectorSpec(mediaQuery.selectors, selectorName);

  foreach(content, (value, key) => {
    if (isMediaQueryDeclaration.test(key)) {
      assert(false, 'media queries cannot be nested into each other');
    } else if (isStandaloneSelector.test(key)) {
      processStyleAndMediaQueryAndSelector(styles, styleName, mediaQueryName, selectorName + key, value);
    } else if (hasAttachedSelector.test(key)) {
      assert(false, 'styles cannot be nested into each other');
    } else {
      processRule(selector.rules, key, value);
    }
  });
}

function processRule(rules, key, value) {
  assert(typeof value === 'string' || typeof value === 'number', 'value must be a number or a string');
  rules[key] = value;
}

function initStyleSpec(styles, name) {
  assert(isValidStyleName.test(name), 'style name is invalid');

  styles[name] = styles[name] || { rules: {}, selectors: {}, mediaQueries: {} };
  return styles[name];
}

function initMediaQuerySpec(mediaQueries, name) {
  mediaQueries[name] = mediaQueries[name] || { rules: {}, selectors: {} };
  return mediaQueries[name];
}

function initSelectorSpec(selectors, name) {
  selectors[name] = selectors[name] || { rules: {} };
  return selectors[name];
}

function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function assertPlainObject(content) {
  assert(isPlainObject(content), 'value must be a plain object');
}
