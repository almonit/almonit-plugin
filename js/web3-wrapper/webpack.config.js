var path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
		libraryTarget: 'var',
		library: 'WEB3ENS'
  }
};
