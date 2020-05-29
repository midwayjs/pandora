import { componentName, componentConfig } from '@pandorajs/component-decorator';
import { LogProcessor } from './LogProcessor';

@componentName('logger')
@componentConfig({
  logger: {
    poolSize: 50,
  },
})
export default class ComponentLogger {
  logProcessor: LogProcessor;

  constructor(ctx) {
    ctx.logProcessor = this.logProcessor = new LogProcessor();
  }
}

export * from './types';
