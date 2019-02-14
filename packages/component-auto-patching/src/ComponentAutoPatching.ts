import { componentName, dependencies, componentConfig } from 'pandora-component-decorator';
import { PandoraTracer } from 'pandora-tracer';
import { AutoPatchingConfig } from './domain';
import { Patcher } from './Patcher';
import {
  GlobalPatcher,
  HttpServerPatcher,
  HttpClientPatcher,
  MySQLPatcher,
  MySQL2Patcher
} from './patchers';

@componentName('autoPatching')
@dependencies(['trace', 'errorLog'])
@componentConfig({
  trace: {
    kTracer: PandoraTracer
  },
  autoPatching: {
    patchers: {
      global: {
        enabled: true,
        klass: GlobalPatcher
      },
      httpServer: {
        enabled: true,
        klass: HttpServerPatcher
      },
      httpClient: {
        enabled: true,
        klass: HttpClientPatcher
      },
      mysql: {
        enabled: true,
        klass: MySQLPatcher
      },
      mysql2: {
        enabled: true,
        klass: MySQL2Patcher
      }
    }
  }
})
export default class ComponentAutoPatching {
  ctx: any;
  patchers;
  instances: Map<string, Patcher> = new Map();

  constructor(ctx) {
    this.ctx = ctx;
    const config: AutoPatchingConfig = this.ctx.config.autoPatching;
    this.patchers = config.patchers || {};
  }

  async start() {
    const patchers = this.patchers;

    for (const name in patchers) {
      const patcher = patchers[name];
      const Klass = patcher.klass;
      if (patcher.enabled) {
        const pInstance = new Klass(this.ctx);
        pInstance.init();
        pInstance.attach();
        this.instances.set(name, pInstance);
      }
    }
  }

  async stop() {
    for (const instance of this.instances.values()) {
      instance.unattach();
    }

    this.instances.clear();
  }
}

export * from './Patcher';
export * from './patchers/index';
export * from './Shimmer';
export * from './cls';
export * from './domain';
export * from './constants';
export * from './utils';
