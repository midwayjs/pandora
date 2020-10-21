import { componentName, dependencies } from '@pandorajs/component-decorator';
import createEggAppInstrument from './EggInstrument';
import { EggApplication } from 'egg';
import { Transport } from './type';
import ExceptionLogTransport from './ExceptionLogTransport';

@componentName('instrumentEgg')
@dependencies(['metric'])
export default class ComponentInstrumentEgg {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
    this.ctx.eggInstrument = createEggAppInstrument(ctx);
    this.ctx.eggAgentInstrument = (agent: EggApplication) => {
      for (const name of agent.loggers.keys()) {
        const logger = agent.loggers.get(name);
        let path;
        for (const transport of logger.values()) {
          path = (transport as Transport).options.file;
          if (path) break;
        }

        logger.set(
          'pandora',
          new ExceptionLogTransport(agent.pandora.exceptionProcessor, {
            path,
          })
        );
      }
    };
  }
}

export * as constant from './constant';
