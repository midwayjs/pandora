import { componentName, dependencies } from '@pandorajs/component-decorator';
import EggInstrument from './EggInstrument';
import { EggApplication } from 'egg';
import { Transport } from './type';
import LogTransport from './LogTransport';

@componentName('instrumentEgg')
@dependencies(['metric'])
export default class ComponentInstrumentEgg {
  ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
    this.ctx.eggInstrument = EggInstrument;
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
          new LogTransport({
            level: 'ALL',
            path,
            logProcessor: agent.pandora.logProcessor,
          })
        );
      }
    };
  }
}

export * as constant from './constant';
