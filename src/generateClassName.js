/*
 * @providesModule generateClassName
 */

import compressClassName from 'compressClassName';

export default function generateClassName(id, options = {}) {
  var result = '';

  if (options.prefix) {
    result += options.prefix + '-';
  } else if (options.prefixes) {
    result += options.prefixes.join('-') + '-';
  }

  result += id;

  if (options.compressClassNames) {
    return compressClassName(result, options);
  }

  return result;
}
