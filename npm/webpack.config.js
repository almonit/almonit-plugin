var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
		libraryTarget: 'var',
		library: 'WEB3ENS'
  }
};
