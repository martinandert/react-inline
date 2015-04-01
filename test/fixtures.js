var path = require('path');
var fs = require('fs');

['one'].forEach(function(f) {
  exports[f] = {
    id: 'test/fixtures/' + f,
    source: fs.readFileSync(path.join(__dirname, 'fixtures', f + '.js'), { encoding: 'utf8' }),
    transformed: fs.readFileSync(path.join(__dirname, 'fixtures', f + '.transformed.js'), { encoding: 'utf8' }),
    transformedAndCompressed: fs.readFileSync(path.join(__dirname, 'fixtures', f + '.transformed.compressed.js'), { encoding: 'utf8' })
  };
});
