import { componentName, dependencies } from 'pandora-component-decorator';
import { AutoPatchingConfig } from './domain';

@componentName('autoPatching')
@dependencies(['trace', 'errorLog'])
export default class ComponentAutoPatching {
  ctx: any;

  constructor(ctx) {
    this.ctx = ctx;
    const config: AutoPatchingConfig = this.ctx.options.autoPatching;
    const patchers = config.patchers;

    for (const name in patchers) {
      const patcher = patchers[name];
      const Klass = patcher.klass;
      if (patcher.enabled) {
        const pInstance = new Klass(ctx);
        pInstance.attach();
      }
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