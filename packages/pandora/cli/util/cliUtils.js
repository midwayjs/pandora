'use strict';

const path = require('path');
const fs = require('fs');


exports.preCheck = (targetPath, appName) => {
  let appRoot = process.cwd();
  let pkgPath = path.join(appRoot, 'package.json');

  // start path must be process.cwd()
  let procFilePath = path.join(appRoot, 'procfile.js');

  if(fs.existsSync(pkgPath) && !fs.existsSync(procFilePath)) {

    const template = `
  'use strict';

module.exports = (pandora) => {

  /**
   * default is fork mode
   */
  pandora
    .fork('${targetPath}', '${appName}');

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
    console.log(`pandora: procfile.js was auto generator at ${procFilePath}`);
  }
};

