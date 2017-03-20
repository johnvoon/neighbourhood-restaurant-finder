var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var autoprefixer = require('autoprefixer');
var extractCSS = new ExtractTextPlugin('[name].css')
var extractSCSS = new ExtractTextPlugin('[name].css');

module.exports = {
  entry: {
    bundle: './src/index',
  },
  output: {
    path: './dist',
    publicPath: '/dist',
    filename: '[chunkhash].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: extractCSS.extract(['css-loader', 'postcss-loader'])
      },
      {
        test: /\.scss$/,
        use: extractSCSS.extract(['css-loader', 'postcss-loader', 'sass-loader'])
      },
      {
        test: /\.(woff(2)?|eot|ttf|svg|gif|png)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url-loader'
      },
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: false,
      options: {
        postcss: [
          autoprefixer(),
        ]
      }
    }),
    extractSCSS,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      hash: true
    }),
    new CleanWebpackPlugin([
      'dist'
    ])
  ]
};
