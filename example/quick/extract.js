var fs = require('fs');
var Extractor = require('react-inline/extractor');

Extractor.transformFile('Button.original.js', function(err, result) {
  if (err) {
    throw err;
    return;
  }

  fs.writeFileSync('Button.transformed.js', result.code);

  if (result.css) {
    fs.writeFileSync('Button.transformed.css', result.css);
  }
});

Extractor.transformFile('Button.original.js', { vendorPrefixes: true, compressClassNames: true }, function(err, result) {
  if (err) {
    throw err;
    return;
  }

  fs.writeFileSync('Button.transformed.compressed.js', result.code);

  if (result.css) {
    fs.writeFileSync('Button.transformed.compressed.css', result.css);
  }
});
