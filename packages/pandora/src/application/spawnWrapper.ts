'use strict';

const wrap = require('pandora-spawn-wrap');
import {SpawnWrapperUtils} from './SpawnWrapperUtils';

async function main () {

  SpawnWrapperUtils.increaseLevel();

  if(!SpawnWrapperUtils.decideFollow()) {
    // unwrap it
    if(wrap.lastUnwrap) {
      wrap.lastUnwrap(true);
    }
  }

  if(process.argv[2].endsWith('/npm')) {
    wrap.runMain();
    return;
  }

  try {
    // TODO: SOMETHING
  } catch (err) {
    console.error(err);
  }
  wrap.runMain();

}

main().catch(console.error);
