'use strict';

import recast from 'recast';

function makeObjectExpression(source) {
  return recast.parse('var expr = ' + source).program.body[0].declarations[0].init;
}

export default {
  makeObjectExpression
};
