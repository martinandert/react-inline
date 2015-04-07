/*
 * @providesModule pseudoClasses
 */

const nonFunctionalPseudoClasses = [
  'active',
  'checked',
  'default',
  'disabled',
  'empty',
  'enabled',
  'first',
  'first-child',
  'first-of-type',
  'fullscreen',
  'focus',
  'hover',
  'indeterminate',
  'in-range',
  'invalid',
  'last-child',
  'last-of-type',
  'left',
  'link',
  'only-child',
  'only-of-type',
  'optional',
  'out-of-range',
  'read-only',
  'read-write',
  'required',
  'right',
  'root',
  'scope',
  'target',
  'valid',
  'visited'
];

const functionalPseudoClasses = [
  'dir',
  'lang',
  'not',
  'nth-child',
  'nth-last-child',
  'nth-last-of-type',
  'nth-of-type',
];

const allPseudoClasses = nonFunctionalPseudoClasses.concat(functionalPseudoClasses);

const nonFunctionalRegExp = new RegExp('^(' + nonFunctionalPseudoClasses.join('|') + ')$');
const functionalRegExp    = new RegExp('^(' + functionalPseudoClasses.join('|') + ')\\([^\\)]+\\)$');

function isValidPseudoClass(candidate) {
  return nonFunctionalRegExp.test(candidate) || functionalRegExp.test(candidate);
};

export default {
  all: allPseudoClasses,
  functional: functionalPseudoClasses,
  nonFunctional: nonFunctionalPseudoClasses,

  isValid: isValidPseudoClass
}
