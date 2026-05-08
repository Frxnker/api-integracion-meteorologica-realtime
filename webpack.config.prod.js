const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/css', to: 'css' },
        { from: 'public/icon.svg', to: 'icon.svg' },
        { from: 'public/favicon.ico', to: 'favicon.ico' },
        { from: 'public/robots.txt', to: 'robots.txt' },
        { from: 'public/icon.png', to: 'icon.png' },
        { from: 'public/404.html', to: '404.html' },
        { from: 'public/site.webmanifest', to: 'site.webmanifest' },
      ],
    }),
  ],
});
