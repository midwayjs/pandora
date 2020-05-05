process.env.NODE_ASYNC_HOOK_NO_WARNING = 'true';
import { EventEmitter } from 'events';
import { ICLSNamespace, ICLSContext } from './types';

const cls = require('cls-hooked');

export class CLS {
  private static instance;

  ns: ICLSNamespace = cls.createNamespace('pandora_auto_patching');

  static getInstance(): CLS {
    if (!this.instance) {
      this.instance = new CLS();
    }
    return this.instance;
  }

  set(key: string, value: any): any {
    return this.ns.set(key, value);
  }

  get(key: string): any {
    return this.ns.get(key);
  }

  bind(fn: Function, context?: ICLSContext) {
    return this.ns.bind(fn, context);
  }

  run(fn: Function) {
    return this.ns.run(fn);
  }

  bindEmitter(emitter: EventEmitter) {
    return this.ns.bindEmitter(emitter);
  }

  get namespace(): ICLSNamespace {
    return this.ns;
  }

}
