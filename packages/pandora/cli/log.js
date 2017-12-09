'use strict';
const path = require('path');
const fs = require('fs');
const Tail = require('tail').Tail;
const readLastLines = require('read-last-lines');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {getAppLogPath, getDaemonLogPath, getDaemonStdoutLogPath} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {calcAppName} = require(path.join(PANDORA_LIB_HOME, 'universal/Helpers'));

exports.command = 'log [appName]';
exports.desc = 'Show logs of an application';
exports.builder = yargs => {
  yargs.options({
    'follow': {
      alias: 'f',
      demandOption: false,
      desc: 'follow the output of the log',
      type: 'boolean',
    },
    'lines': {
      alias: 'l',
      demandOption: false,
      default: 50,
      desc: 'lines of log to output, can be overridden by `--full`',
      type: 'number'
    },
    'full': {
      demandOption: false,
      type: 'boolean',
      desc: 'output the full content of the log, overrides `--lines`',
    },
    'daemon': {
      alias: 'd',
      demandOption: false,
      type: 'boolean',
      desc: 'output the logs of Pandora daemon instead of an app. Other options still apply.',
    },
    'daemon-stdout': {
      demandOption: false,
      type: 'boolean',
      desc: 'output the stdout logs of Pandora daemon instead of an app. Other options still apply.',
    }
  });
};

const readLogFile = (logPath, lines) => {
  return readLastLines.read(logPath, lines).then(lines => {
    console.log(lines);
  });
};

exports.handler = argv => {

  let logPath;

  if (argv.daemon) {
    logPath = getDaemonLogPath();
  } else if (argv.daemonStdout) {
    logPath = getDaemonStdoutLogPath();
  } else {
    const appName = argv.appName || calcAppName(process.cwd());
    logPath = getAppLogPath(appName, 'nodejs_stdout');
  }

  const lines = argv.lines;

  // make sure the log file exists
  if (!fs.existsSync(logPath)) {
    throw Error(`Log file ${logPath} doesn't exist!`);
  }

  // follow content changes
  if (argv.follow) {
    return readLogFile(logPath, lines).then(() => {
      const tail = new Tail(logPath);
      tail.on("line", line => {
        console.log(line);
      });
      tail.on("error", err => {
        console.log('ERROR: ', err);
        process.exit(1);
      });
    });
  }

  // simply output all the content of the log file
  if (argv.full) {
    const rs = fs.createReadStream(logPath);
    rs.on('close', () => {
      process.exit(0);
    });
    rs.on('error', err => {
      console.error(err);
      process.exit(1)
    });
    rs.pipe(process.stdout);
    return;
  }

  // read the last N lines of the log file
  readLogFile(logPath, lines)
    .then(() => {
      process.exit(0);
    }).catch(e => {
    console.log(e);
    process.exit(1);
  })
};
