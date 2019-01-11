import { ITracer } from 'pandora-component-trace';
import { CLS } from '../../cls';
import { PatcherOptions } from '../../domain';

export class Wrapper {
  ctx: any;
  tracer: ITracer;
  cls: CLS;
  options: PatcherOptions;
  moduleName: string;

  constructor(ctx: any, tracer: ITracer, cls: CLS, moduleName: string, options: PatcherOptions) {
    this.ctx = ctx;
    this.tracer = tracer;
    this.cls = cls;
    this.moduleName = moduleName;
    this.options = options;
  }

  wrap(target: any): void {}
  unwrap(target: any): void {}
}