'use strict';
const path = require('path');
const {promisify} = require('util');
const pstree = promisify(require('ps-tree'));
const lookup = promisify(require('ps-node').lookup);
const treeify = require('treeify');
const debug = require('debug')('pandora:cli:ps');
const PANDORA_LIB_HOME = path.join(__dirname, '../dist');
const {consoleLogger} = require(path.join(PANDORA_LIB_HOME, 'universal/LoggerBroker'));
const {send, isDaemonRunning} = require(path.join(PANDORA_LIB_HOME, 'daemon/DaemonHandler'));


const populateSubTree = (ppid, children) => {
  const childrenMap = {};
  const remoteChildren = [];

  for (const child of children) {
    if (child.PPID === ppid.toString()) {
      childrenMap[child.PID] = null;
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

const transformKey = async pid => {
  let info = (await lookup({pid}))[0];
  if (info && info.arguments) {
    return `[${pid}] ${info.arguments.join(' ')}`;
  }
  return `[${pid}] [UNKNOWN COMMAND]`
};

const transformKeys = async tree => {
  for (const key in tree) {
    const newKey = await transformKey(key);
    if (tree[key] === null) {
      tree[newKey] = null;
    } else {
      tree[newKey] = await transformKeys(tree[key]);
    }
    delete tree[key];
  }
  return tree;
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

        let ps = {};
        for (const app of data) {
          for (const pid of app.pids) {
            const children = await pstree(pid);
            if (children.length) {
              ps[pid] = await populateSubTree(pid, children);
            } else {
              ps[pid] = null;
            }
            ps = await transformKeys(ps);
          }
        }
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
