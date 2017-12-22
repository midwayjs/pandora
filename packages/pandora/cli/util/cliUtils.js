'use strict';

const path = require('path');
const fs = require('fs');
const colors = require('colors');
const inquirer = require('inquirer');


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


exports.initProcfile = async (targetPath, name) => {

  if(!targetPath || !name) {
    return;
  }

  let appRoot = process.cwd();

  // start path must be process.cwd()
  let procFilePath = path.join(appRoot, 'procfile.js');

  targetPath = targetPath.startsWith('/') ? targetPath : (
    targetPath.startsWith('./') ? targetPath : './' + targetPath
  );

  if(targetPath.startsWith('/')) {
    throw new Error('TargetPath cannot starts with /');
  }

  if(!fs.existsSync(procFilePath)) {
    writeProcfile(targetPath, name, procFilePath);
    return;
  }

  inquirer.prompt([
    {
      name: 'overwrite',
      message: colors.red('The procfile.js at ' + procFilePath + ' already exists, do you want to overwrite it ?'),
      type: 'confirm'
    }
  ]).then((res) => {
    if(res.overwrite) {
      writeProcfile(targetPath, name, procFilePath);
    }
  }).catch(console.error);


};

function writeProcfile(targetPath, name, procFilePath) {


  inquirer.prompt([
    {
      name: 'type',
      message: colors.yellow('Which type do you like to generate ?'),
      type: 'list',
      choices: [
        'fork',
        'cluster'
      ]
    }
  ]).then((res) => {

    const type = res.type;
    let content;

    switch (type) {

      case 'fork':

        content = (

`'use strict';

module.exports = (pandora) => {

  pandora
    .fork('${name}', '${targetPath}');

  /**
   * you can also use cluster mode to start application
   */
  // pandora
  //   .cluster('${targetPath}');

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

};`
        );

        break;

      case 'cluster':

        content = (

`'use strict';

module.exports = (pandora) => {

  pandora
    .cluster('${targetPath}');

  /**
   * you can also use fork mode to start application 
   */
  // pandora
  //   .fork('${name}', '${targetPath}');

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

};`
        );

        break;

    }


    fs.writeFileSync(procFilePath, content);

    consoleLogger.important(`The procfile.js was auto generated at ${procFilePath}`);

  }).catch(console.error);

}


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
