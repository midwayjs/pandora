'use strict';

const path = require('path');
const fs = require('fs');
const colors = require('colors');

class MyConsole extends console.Console {
  constructor() {
    super(process.stdout, process.stderr);
  }
  important(msg) {
    this.log(colors.green(`** ${msg} **`));
  }
  error(msg) {
    this.log(colors.red(`${msg}`));
  }
}

const consoleLogger = exports.consoleLogger = new MyConsole();

exports.preCheck = (targetPath, appName) => {

  if(!targetPath || !appName) {
    return;
  }

  let appRoot = process.cwd();
  let pkgPath = path.join(appRoot, 'package.json');

  // start path must be process.cwd()
  let procFilePath = path.join(appRoot, 'procfile.js');

  targetPath = targetPath.startsWith('/') ? targetPath : (
    targetPath.startsWith('./') ? targetPath : './' + targetPath
  );

  if(targetPath.startsWith('/')) {
    return;
  }

  if(fs.existsSync(pkgPath) && !fs.existsSync(procFilePath)) {

    const template = `'use strict';

module.exports = (pandora) => {

  /**
   * default is fork mode
   */
  pandora
    .fork('${appName}', '${targetPath}');

  /**
   * you can use cluster mode to start application
   */
  // pandora
  //   .cluster('./cluster.js');

  /**
   * you can create another process here
   */
  // pandora
  //   .process('background')
  //   .argv(['--expose-gc']);

  /**
   * more features please visit our document.
   * https://github.com/midwayjs/pandora/
   */

};`;

    fs.writeFileSync(procFilePath, template);
    consoleLogger.important(`The procfile.js was auto generated at ${procFilePath}`);
  }
};


exports.dirnameUntilPkgJson = function (targetPath) {

  let cur = targetPath;

  while (true) {
    if(fs.existsSync(path.join(cur, 'package.json'))) {
      return cur;
    }
    cur = path.dirname(cur);
    if(cur === '/') {
      return null;
    }
  }

};
