'use strict';

const wrap = require('pandora-spawn-wrap');
import {MonitorManager} from '../monitor/MonitorManager';
import {SpawnWrapperUtils} from './SpawnWrapperUtils';


async function main () {

  if(process.argv[2].endsWith('/npm')) {
    wrap.runMain();
    return;
  }

  try {
    MonitorManager.injectProcessMonitor();
    await SpawnWrapperUtils.shimProcessContext().start();
  } catch (err) {
    console.error(err);
  }
  wrap.runMain();

}

main().catch(console.error);
