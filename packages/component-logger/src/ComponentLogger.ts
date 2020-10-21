import { componentName, dependencies } from '@pandorajs/component-decorator';
import { ExceptionProcessor } from './ExceptionProcessor';

@componentName('logger')
@dependencies(['metric'])
export default class ComponentLogger {
  exceptionProcessor: ExceptionProcessor;

  constructor(ctx) {
    const meter = ctx.meterProvider.getMeter('pandora');
    ctx.exceptionProcessor = new ExceptionProcessor(meter);
    this.exceptionProcessor = ctx.exceptionProcessor;
  }
}

export { ExceptionProcessor } from './ExceptionProcessor';
export * from './types';
