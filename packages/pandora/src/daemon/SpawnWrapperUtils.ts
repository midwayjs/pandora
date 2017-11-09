import wrap = require('spawn-wrap');
const wrapFile = require.resolve('./spawnWrapper');

export class SpawnWrapperUtils {
  static wrapped = false;
  static wrap() {
    if(!SpawnWrapperUtils.wrapped) {
      wrap([wrapFile]);
    }
  }
}
