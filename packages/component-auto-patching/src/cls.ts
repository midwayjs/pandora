process.env.NODE_ASYNC_HOOK_NO_WARNING = 'true';
const asyncWrap = (<any>process).binding('async_wrap');
import { wrap } from './Shimmer';
import { EventEmitter } from 'events';
import { ICLSNamespace, ICLSContext } from './domain';

wrap(asyncWrap, 'setupHooks', function(setupHooks) {
  return function _setupHooks(hooks) {
    try {
      setupHooks.call(asyncWrap, hooks);
    } catch (err) {
      setupHooks.call(
        asyncWrap,
        hooks.init,
        hooks.pre,
        hooks.post,
        hooks.destroy
      );
    }
  };
});

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