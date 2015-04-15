'use strict';

var webpack = require('webpack');

var PRODUCTION = process.env.NODE_ENV === 'production';

function plugins() {
  var all = [
    new webpack.NormalModuleReplacementPlugin(/^react$/, 'react/addons')
  ];

  var production = [
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } })
  ];

  return PRODUCTION ? all.concat(production) : all;
}

module.exports = {
  cache: true,
  entry: './lib/client.js',

  output: {
    filename:   'bundle.js',
    path:       'public',
    publicPath: '/'
  },

  module: {
    loaders: [
      { test: require.resolve('react/addons'), loader: 'expose?React' }
    ]
  },

  plugins: plugins()
};
