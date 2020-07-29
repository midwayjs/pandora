import { componentName, componentConfig } from '@pandorajs/component-decorator';
import { ExceptionProcessor } from './ExceptionProcessor';

@componentName('logger')
@componentConfig({
  logger: {
    poolSize: 50,
  },
})
export default class ComponentLogger {
  exceptionProcessor: ExceptionProcessor;

  constructor(ctx) {
    ctx.exceptionProcessor = this.exceptionProcessor = new ExceptionProcessor();
  }
}

export { ExceptionProcessor } from './ExceptionProcessor';
export * from './types';
