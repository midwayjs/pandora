const cp = require('child_process');
const res = cp.fork('./level3.js');
const spawnargs = res.spawnargs;
let wrong = false;
for(const arg of spawnargs) {
  if(arg.indexOf('.pandora-tmp-cache/.node-spawn-wrap') > -1) {
    wrong = true;
    break;
  }
}

require('fs').writeFileSync(require('os').tmpdir() + '/pandora_test_level2.xxx', wrong.toString());
