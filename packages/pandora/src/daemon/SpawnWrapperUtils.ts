import wrap = require('pandora-spawn-wrap');
import {PANDORA_APPLICATION} from '../const';
import {ProcessRepresentation} from '../domain';
import {WorkerContext} from '../application/WorkerContext';
import {Facade} from '../Facade';

const wrapFile = require.resolve('./spawnWrapper');

export class SpawnWrapperUtils {
  private static unwrapFn: () => void;

  static wrap() {
    if (!SpawnWrapperUtils.unwrapFn) {
      SpawnWrapperUtils.unwrapFn = wrap([wrapFile]);
    }
  }

  static unwrap() {
    if (SpawnWrapperUtils.unwrapFn) {
      this.unwrapFn();
      this.unwrapFn = null;
    }
  }

  static shimWorkerContext() {
    let processRepresentation: ProcessRepresentation = <any> {};
    try {
      processRepresentation = JSON.parse(process.env[PANDORA_APPLICATION]);
    } catch (err) {
      // ignore
    }
    const context = new WorkerContext(processRepresentation);
    Facade.set('workerContext', context.workerContextAccessor);
    return context;
  }

}
