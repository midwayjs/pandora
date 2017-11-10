import wrap = require('spawn-wrap');
const wrapFile = require.resolve('./spawnWrapper');

export class SpawnWrapperUtils {
  private static unwrapFn: () => void;
  static wrap() {
    if(!SpawnWrapperUtils.unwrapFn) {
      SpawnWrapperUtils.unwrapFn = wrap([wrapFile]);
    }
  }
  static unwrap() {
    if(SpawnWrapperUtils.unwrapFn) {
      this.unwrapFn();
      this.unwrapFn = null;
    }
  }

  static async transaction(fn) {
    SpawnWrapperUtils.wrap();
    let ret;
    let caughtError;
    try {
      ret = await fn();
    }  catch (error) {
      caughtError = error;
    } finally {
      SpawnWrapperUtils.unwrap();
    }
    if(caughtError) {
      throw caughtError;
    }
    return ret;
  }

}
