'use strict';
const path = require('path');
const spawn = require('child_process').spawn;
const treeify = require('treeify');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));


const populateSubTree = (ppid, children) => {
  const childrenMap = {};
  const remoteChildren = [];

  for (const child of children) {
    if (child.ppid === ppid) {
      childrenMap[child.pid] = null;
    } else {
      remoteChildren.push(child);
    }
  }

  for (const pid in childrenMap) {
    childrenMap[pid] = populateSubTree(pid, remoteChildren);
  }

  for (const _ in childrenMap) {
    return childrenMap;
  }
  return null;
};

const transformKey = (pid, procs) => {
  let info = procs[pid];
  if (info && info.command) {
    return `[${pid}] ${info.command}`;
  }
  return `[${pid}] [UNKNOWN COMMAND]`
};

const transformKeys = (tree, procs) => {
  for (const key in tree) {
    const newKey = transformKey(key, procs);
    if (tree[key] === null) {
      tree[newKey] = null;
    } else {
      tree[newKey] = transformKeys(tree[key], procs);
    }
    delete tree[key];
  }
  return tree;
};

const spawnPs = () => {
  // ps -A -o pid,ppid,args
  return new Promise(resolve => {
    let output = '';
    const child = spawn('ps', ['-A', '-o', 'pid,ppid,args']);
    child.stdout.on('data', data => {
      output += data.toString();
    });
    child.stdout.on('end', () => {
      resolve(output);
    })
  })
};

const getProcesses = async () => {
  const procs = {};
  let ps = await spawnPs();
  ps = ps.split('\n');
  ps.shift();   // get rid of the header
  ps.pop();     // get rid of the last empty line

  ps.forEach(line => {
    line = line.trim();
    const matches = line.match(/(\d+)\s+(\d+)\s+(.+)/);
    matches.shift();
    const [pid, ppid, command] = matches;
    procs[pid] = {
      pid, ppid, command
    };
  });
  return procs;
};

const getChildren = (ppid, procs) => {
  const children = [];
  for (const pid in procs) {
    if (procs[pid].ppid === ppid) {
      children.push(procs[pid]);
    }
  }
  return children;
};

exports.command = 'ps';
exports.desc = 'Get a tree composed of ';
exports.handler = argv => {
  console.log('Gathering process tree information...');
  isDaemonRunning().then(isRunning => {
    if (!isRunning) {
      consoleLogger.info('Daemon is not running yet');
      process.exit(0);
      return;
    }

    send('list', {}, (err, data) => {
      (async data => {
        if (err) {
          consoleLogger.error(err);
          process.exit(1);
          return;
        }

        const procs = await getProcesses();

        let ps = {};
        for (const app of data) {
          for (let pid of app.pids) {
            pid += '';
            const children = getChildren(pid, procs);
            if (children.length) {
              ps[pid] = populateSubTree(pid, children);
            } else {
              ps[pid] = null;
            }
          }
        }
        ps = transformKeys(ps, procs);
        const tree = treeify.asTree(ps, true);
        console.log(tree);
        process.exit(0);
      })(data).catch(err => {
        console.error(err);
        process.exit(1);
      })
    });
  });
};
