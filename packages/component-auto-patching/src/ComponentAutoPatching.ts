import { componentName, dependencies } from 'pandora-component-decorator';
import { AutoPatchingConfig } from './domain';
import { Patcher } from './Patcher';

@componentName('autoPatching')
@dependencies(['trace', 'errorLog'])
export default class ComponentAutoPatching {
  ctx: any;
  patchers;
  instances: Map<string, Patcher>;

  constructor(ctx) {
    this.ctx = ctx;
    const config: AutoPatchingConfig = this.ctx.options.autoPatching;
    this.patchers = config.patchers || {};
  }

  async start() {
    const patchers = this.patchers;

    for (const name in patchers) {
      const patcher = patchers[name];
      const Klass = patcher.klass;
      if (patcher.enabled) {
        const pInstance = new Klass(this.ctx);
        pInstance.attach();
        this.instances.set(name, pInstance);
      }
    }
  }

  async stop() {
    for (const instance of this.instances.values()) {
      instance.unattach();
    }
  }
}

export * from './Patcher';
export * from './patchers/GlobalPatcher';
export * from './patchers/HttpServerPatcher';
export * from './Shimmer';
export * from './cls';
export * from './domain';
export * from './constants';