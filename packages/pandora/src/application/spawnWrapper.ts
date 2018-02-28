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
    const context = SpawnWrapperUtils.shimProcessContext();
    // Make sure start IPC Hub at very beginning, be course of injectMonitor() needs
    if(!process.env.SKIP_IPC_HUB) {
      await context.getIPCHub().start();
    }
    MonitorManager.injectProcessMonitor();
    await context.start();
  } catch (err) {
    console.error(err);
  }
  wrap.runMain();

}

main().catch(console.error);
