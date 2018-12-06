'use strict';

const wrap = require('pandora-spawn-wrap');
import {SpawnWrapperUtils} from './SpawnWrapperUtils';
import {consoleLogger} from '../common/Helpers';
import {CoreSDK} from 'pandora-core-sdk';
import {PANDORA_PROCESS} from '../const';

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
    const coreSdk = new CoreSDK({
      mode: 'worker',
      appName, appDir
    });
    // TODO: facade require('pandora') also needs in version 2
    await coreSdk.start();
  } catch (err) {
    consoleLogger.error(err);
  }
  wrap.runMain();

}

main().catch(consoleLogger.error.bind(consoleLogger));
