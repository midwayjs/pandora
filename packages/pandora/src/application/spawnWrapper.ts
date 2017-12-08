'use strict';

const wrap = require('pandora-spawn-wrap');
import {MonitorManager} from '../monitor/MonitorManager';
import {SpawnWrapperUtils} from './SpawnWrapperUtils';


async function main () {
  try {
    MonitorManager.injectProcessMonitor();
    await SpawnWrapperUtils.shimProcessContext().start();
  } catch (err) {
    console.error(err);
  }
  wrap.runMain();
}

main().catch(console.error);
