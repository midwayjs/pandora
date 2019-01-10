import { componentName, dependencies } from 'pandora-component-decorator';
import { PatcherOptions } from './domain';

@componentName('autoPatching')
@dependencies(['trace', 'errorLog'])
export default class ComponentAutoPatching {
  ctx: any;

  constructor(ctx) {
    this.ctx = ctx;
    const config = this.ctx.options.autoPatching;
    const patchers = config.patchers;

    for (const patcher in patchers) {
      const Klass = (<PatcherOptions>patcher).klass;
      if ((<PatcherOptions>patcher).enabled) {
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