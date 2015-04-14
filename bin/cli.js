#!/usr/bin/env node

process.title = 'react-inline-extract';

var merge     = require('object-assign');
var babel     = require('babel-core');
var info      = require('../package.json');
var extractor = require('../extractor');
var bundler   = require('../bundler');

function collectMediaMap(item, memo) {
  var nameAndQuery = item.split('=');
  memo[nameAndQuery[0]] = nameAndQuery[1];
  return memo;
}

require('commoner')
  .version(info.version)
  .option('-p, --vendor-prefixes', 'Add vendor prefixes to generated CSS')
  .option('-o, --compress-class-names', 'Compress class names in generated CSS')
  .option('-m, --minify', 'Minify generated CSS')
  .option('-q, --media-map <name=query>', 'Add media query shortcut, e.g. "phone=media (max-width: 640px)"', collectMediaMap, {})
  .option('-b, --bundle <file>', 'Bundle all generated CSS into file (default: "bundle.css")', 'bundle.css')
  .option('-B, --no-bundle', 'Disable bundling CSS')
  .option('-a, --babelize', 'Add a Babel transformation step')
  .option('-s, --babel-stage <stage>', 'Set Babel\'s experimental proposal stage (default: 2)', 2)
  .resolve(
    function(id) {
      var context = this;

      return context.getProvidedP().then(function(idToPath) {
        // if a module declares its own identifier using
        // @providesModule then that identifier will be
        // a key in the idToPath object
        if (idToPath.hasOwnProperty(id)) {
          return context.readFileP(idToPath[id]);
        }
      });
    },

    function(id) {
      // otherwise assume the identifier maps
      // directly to a filesystem path
      return this.readModuleP(id);
    }
  )
  .process(
    function(id, source) {
      var options = this.options;

      var extractOptions = merge({}, options, {
        filename: id, cacheDir: this.cacheDir
      });

      var result = extractor.transform(source, extractOptions);

      if (options.babelize) {
        var babelOptions = {
          ast: false,
          optional: ['runtime'],
          stage: options.babelStage
        };

        result.code = babel.transform(result.code, babelOptions).code;
      }

      if (result.css) {
        return { '.js':  result.code, '.css': result.css }
      } else {
        return result.code;
      }
    }
  )
  .done(
    function() {
      var options = this.options;

      if (options.bundle) {
        var fileName = options.bundle === true ? 'bundle.css' : options.bundle;

        bundler.bundle(options.outputDir, fileName, options);
      }
    }
  );

