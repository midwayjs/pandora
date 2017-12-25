const {execSync} = require('child_process');
console.time('x');
const res = execSync('node ./x.js');
console.timeEnd('x');
console.log(res.toString());
