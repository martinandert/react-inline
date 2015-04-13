/*
 * @providesModule generateClassName
 */

import compressClassName from 'compressClassName';

const invalidChars = /[^_a-z0-9-]/ig;

export default function generateClassName(id, options) {
  var result = '';

  if (options.prefix) {
    result += options.prefix.replace(invalidChars, '_') + '-';
  } else if (options.prefixes) {
    result += options.prefixes.map(p => p.replace(invalidChars, '_')).join('-') + '-';
  }

  result += id;

  if (options.compressClassNames) {
    return compressClassName(result, options);
  }

  return result;
}
