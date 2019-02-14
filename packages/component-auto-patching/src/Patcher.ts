import { hook, IHook } from 'module-hook';
import * as shimmer from './Shimmer';
import { IShimmer, PatcherOptions } from './domain';
import { ITracer, IPandoraContext } from 'pandora-component-trace';
import * as assert from 'assert';
import { CLS } from './cls';
import { CURRENT_CONTEXT } from './constants';

export class Patcher {

  protected ctx;
  protected _moduleName: string;
  protected _spanName: string;
  protected options: PatcherOptions;
  protected cls: CLS = CLS.getInstance();
  protected inited: boolean = false;
  protected _tagPrefix = '';

  constructor(ctx: any) {
    this.ctx = ctx;
  }

  get logger() {
    return this.ctx.logger;
  }

  get recordErrorDetail() {
    return this.options.recordErrorDetail || false;
  }

  get tagPrefix() {
    return this.options.tagPrefix || this._tagPrefix;
  }

  init() {
    /* istanbul ignore next */
    if (!this.inited) {
      const config = this.ctx.config || {};
      const patcherConfig = config.autoPatching || { patchers: {} };
      this.options = patcherConfig.patchers[this.moduleName] || {
        enabled: true
      };

      this.inited = true;
    }
  }

  get hook(): IHook {
    return hook;
  }

  get moduleName(): string {
    return this._moduleName;
  }

  get spanName(): string {
    return this._spanName || this._moduleName;
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

  tagName(name: string): string {
    if (this.tagPrefix) {
      return `${this.tagPrefix}.${name}`;
    }

    return name;
  }

  target() {}
  attach() {}
  unattach() {}
}
