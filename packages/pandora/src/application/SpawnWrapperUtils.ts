import wrap = require('pandora-spawn-wrap');
import {PANDORA_PROCESS} from '../const';
import {ProcessRepresentation} from '../domain';
import {ProcessContext} from './ProcessContext';
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

  static shimProcessContext() {
    let processRepresentation: ProcessRepresentation = <any> {};
    try {
      processRepresentation = JSON.parse(process.env[PANDORA_PROCESS]);
    } catch (err) {
      // ignore
    }
    const context = new ProcessContext(processRepresentation);
    Facade.set('processContext', context.processContextAccessor);
    return context;
  }

}
