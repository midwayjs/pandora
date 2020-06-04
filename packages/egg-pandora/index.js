const path = require('path');
const pkg = require('./package.json');

module.exports = {
  path: path.resolve(__dirname, '..'),
  pluginName: pkg.eggPlugin.name,
};
