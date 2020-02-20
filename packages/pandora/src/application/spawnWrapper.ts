'use strict';

const wrap = require('pandora-spawn-wrap');
import {SpawnWrapperUtils} from './SpawnWrapperUtils';
import {consoleLogger} from 'pandora-dollar';
import {PANDORA_PROCESS} from '../const';
import {CoreSDKWithExtendedConfig} from '../util/CoreSDKWithExtendedConfig';

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
    const processRepresentation = JSON.parse(process.env[PANDORA_PROCESS]);
    const {appName, appDir} = processRepresentation;
    const coreSdk = new CoreSDKWithExtendedConfig({
      mode: 'worker',
      appName, appDir
    });
    // TODO: facade require('pandora') also needs in version 2
    await coreSdk.start();
  } catch (err) {
    consoleLogger.error(err);
  }

  // unref all active handles
  // after node.js v11, Timer objects no longer show up in process._getActiveHandles()
  // see: https://github.com/nodejs/node/issues/25806
  try {
    for(const handler of (<any> process)._getActiveHandles()) {
      try {
        handler.unref();
      } catch(err) {
        // ignore
      }
    }
  } catch(err) {
    // ignore
  }

  wrap.runMain();

}

main().catch(consoleLogger.error.bind(consoleLogger));
