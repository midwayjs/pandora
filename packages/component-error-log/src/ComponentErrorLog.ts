import {componentName, dependencies, componentConfig} from '@pandorajs/component-decorator';
import {EndPointManager} from '@pandorajs/component-actuator-server';
import {IndicatorManager} from '@pandorajs/component-indicator';
import {ErrorLogManager} from './ErrorLogManager';
import {RecentWindow} from './RecentWindow';
import {ErrorLog} from './types';
import {ErrorLogEndPoint} from './ErrorLogEndPoint';
import {ErrorLogIndicator} from './ErrorLogIndicator';

@componentName('errorLog')
@dependencies(['indicator'])
@componentConfig({
  errorLog: {
    poolSize: 50
  }
})
export default class ComponentErrorLog {

  ctx: any;
  errorLogManager: ErrorLogManager;
  recentWindow: RecentWindow<ErrorLog>;
  errorLogIndicator: ErrorLogIndicator;

  constructor(ctx) {

    this.ctx = ctx;

    const errorLogConfig = ctx.config.errorLog;
    ctx.errorLogManager = this.errorLogManager = new ErrorLogManager({logger: ctx.logger});
    this.recentWindow = new RecentWindow<ErrorLog>({
      poolSize: errorLogConfig.poolSize
    });
    this.errorLogManager.on('dump', (set) => {
      for(const item of set) {
        this.recentWindow.push(item);
      }
    });

    const indicatorManager: IndicatorManager = ctx.indicatorManager;
    this.errorLogIndicator = new ErrorLogIndicator(this.recentWindow);
    indicatorManager.register(this.errorLogIndicator);

  }
  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new ErrorLogEndPoint(this.ctx));
  }
}

export * from './ErrorLogManager';
export * from './types';
