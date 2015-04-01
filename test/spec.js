var assert    = require('assert');
var Extractor = require('../lib/InlineStylesExtractor');
var fixtures  = require('./fixtures');

describe('The InlineStylesExtractor', function() {
  beforeEach(function() {
    Extractor.reset();
  });

  it('passes its first test', function() {
    var source = 'React.createElement("div", { className: "a-class", style: [myStyles.div, { margin: 30 }] }); var myStyles = StyleSheet.create({ div: { padding: 15 } });';

    var actual   = Extractor.transform("path/to/foo.js", source);
    var expected = 'React.createElement("div", { className: __cx("a-class", "path_to_foo_js__myStyles__div__1"), style: { margin: 30 } });\nvar __cx = require("classnames");\nvar __assign = require("react/lib/Object.assign");\n';

    assert.equal(expected, actual);

    actual   = Extractor.emitBundle();
    expected = '/************ path/to/foo.js -> myStyles ************/\n\n.path_to_foo_js__myStyles__div__1 {\n  padding: 15px;\n}\n\n';

    assert.equal(expected, actual);

    actual    = Extractor.emitBundle({ minify: true });
    expected  = '.path_to_foo_js__myStyles__div__1{padding:15px}';

    assert.equal(expected, actual);

    actual    = Extractor.emitBundle({ minify: true, compressClassNames: true });
    expected  = '._1{padding:15px}';

    assert.equal(expected, actual);
  });

  it('passes its second test', function() {
    var result = Extractor.transform(fixtures.one.id, fixtures.one.source);

    assert.equal(fixtures.one.transformed, result);
  });

  it('passes its third test', function() {
    var result = Extractor.transform(fixtures.one.id, fixtures.one.source, { compressClassNames: true });

    assert.equal(fixtures.one.transformedAndCompressed, result);
  });
});
