const cp = require('child_process');
const res = cp.exec('npm xyz');
const spawnargs = res.spawnargs;
for(const arg of spawnargs) {
  if(arg.indexOf('.pandora-tmp-cache/.node-spawn-wrap') > -1) {
    throw new Error('wrong')
  }
}

