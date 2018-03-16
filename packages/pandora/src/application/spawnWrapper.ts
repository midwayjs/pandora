'use strict';

const wrap = require('pandora-spawn-wrap');
import {MonitorManager} from '../monitor/MonitorManager';
import {SpawnWrapperUtils} from './SpawnWrapperUtils';


async function main () {

  SpawnWrapperUtils.increaseLevel();

  if(!SpawnWrapperUtils.decideFollow()) {
    // unwrap it
    if(wrap.lastUnwrap) {
      wrap.lastUnwrap();
    }
  }

  if(process.argv[2].endsWith('/npm')) {
    wrap.runMain(true);
    return;
  }

  try {
    const context = SpawnWrapperUtils.shimProcessContext();
    // Make sure start IPC Hub at very beginning, be course of injectMonitor() needs
    if(!process.env.SKIP_IPC_HUB) {
      const ipcHub = context.getIPCHub();
      await ipcHub.start();
      await ipcHub.initConfigClient();
    }
    MonitorManager.injectProcessMonitor();
    await context.start();
  } catch (err) {
    console.error(err);
  }
  wrap.runMain();

}

main().catch(console.error);
