import wrap = require('spawn-wrap');
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
const wrapFile = require.resolve('./spawnWrapper');

export class SpawnWrapperUtils {
  static wrapped = false;
  static wrap() {
    if(!SpawnWrapperUtils.wrapped) {
      const globalConfigProcessor = GlobalConfigProcessor.getInstance();
      const globalConfig = globalConfigProcessor.getAllProperties();
      process.env.__pandora_hook = globalConfig['hooks'];
      wrap([wrapFile]);
    }
  }
}
