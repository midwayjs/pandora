import { hook, IHook } from 'module-hook';
import * as shimmer from './Shimmer';
import { IShimmer, PatcherOptions } from './domain';
import { ITracer, IPandoraContext } from 'pandora-component-trace';
import * as assert from 'assert';
import { CLS } from './cls';
import { CURRENT_CONTEXT } from './constants';
import { Wrapper } from './patchers/wrappers/Wrapper';

export class Patcher {

  protected ctx;
  protected _moduleName: string;
  protected options: PatcherOptions;
  protected cls: CLS = CLS.getInstance();
  protected wrapper: Wrapper;
  protected inited: boolean = false;

  constructor(ctx: any) {
    this.ctx = ctx;
  }

  init() {
    if (!this.inited) {
      const patcherConfig = this.ctx.options.autoPatching || { patchers: {} };
      this.options = patcherConfig.patchers[this.moduleName] || {
        enabled: true
      };
      if (this.options.kWrapper) {
        const KWrapper = this.options.kWrapper;
        this.wrapper = new KWrapper(this.ctx, this.tracer, this.cls, this.moduleName, this.options);
      }

      this.inited = true;
    }
  }

  get hook(): IHook {
    return hook;
  }

  get moduleName(): string {
    return this._moduleName;
  }

  get shimmer(): IShimmer {
    return shimmer;
  }

  get tracer(): ITracer {
    const traceManager = this.ctx.traceManager;
    assert(traceManager, 'pandora-component-trace is need!');
    assert(traceManager.tracer, 'pandora-component-trace is need!');
    return traceManager.tracer;
  }

  get currentContext(): IPandoraContext {
    return this.cls.get(CURRENT_CONTEXT);
  }

  set currentContext(context: IPandoraContext) {
    this.cls.set(CURRENT_CONTEXT, context);
  }

  target() {}
  attach() {}
  unattach() {}
}