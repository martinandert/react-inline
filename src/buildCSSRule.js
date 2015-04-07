/*
 * @providesModule buildCSSRule
 */

import {isUnitlessNumber} from 'react/lib/CSSProperty';
import hyphenateStyleName from 'react/lib/hyphenateStyleName';

const isUnquotedContentValue = /^(normal|none|(\b(url\([^)]*\)|chapter_counter|attr\([^)]*\)|(no-)?(open|close)-quote|inherit)((\b\s*)|$|\s+))+)$/;

export default function buildCSSRule(key, value, options) {
  if (!isUnitlessNumber[key] && typeof value === 'number') {
    value = '' + value + 'px';
  } else if (key === 'content' && !isUnquotedContentValue.test(value)) {
    value = "'" + value.replace(/'/g, "\\'") + "'";
  }

  return hyphenateStyleName(key) + ': ' + value + ';';
}
