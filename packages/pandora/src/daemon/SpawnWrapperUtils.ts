import wrap = require('spawn-wrap');
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const wrapFile = require.resolve('./spawnWrapper');

export class SpawnWrapperUtils {
  static wrapped: boolean = false;
  static wrap() {
    if(!SpawnWrapperUtils.wrapped) {
      const globalConfigProcessor = GlobalConfigProcessor.getInstance();
      const globalConfig = globalConfigProcessor.getAllProperties();
      if (globalConfig.pandora_hook) {
        process.env.__pandora_hook = globalConfig.pandora_hook;
      }
      wrap([wrapFile]);
    }
  }
}



