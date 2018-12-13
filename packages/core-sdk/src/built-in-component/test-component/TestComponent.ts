import {componentName, dependencies} from 'pandora-component-decorator';
import {IIndicator, IndicatorScope} from '../indicator/domain';
import {EndPointManager} from '../actuator-server/EndPointManager';
import {IEndPoint} from '../actuator-server/domain';
import {MetricsManager} from '../metrics/MetricsManager';
import {MetricName} from 'metrics-common';

@componentName('test')
@dependencies(['actuatorServer', 'indicator', 'metrics'])
export default class TestComponent {
  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }
  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new TestEndPoint(this.ctx));
    await this.indicator();
  }
  async start() {
    await this.indicator();
    const metricsManager: MetricsManager = this.ctx.metricsManager;
    const cnter = metricsManager.getCounter('a', MetricName.build('x'));
    cnter.inc();
  }
  async indicator() {
    this.ctx.indicatorManager.register(new TestIndicator());
  }
}


class TestEndPoint implements IEndPoint {
  prefix = '/test';
  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }
  route(router) {
    router.get('/', async (ctx, next) => {
      try {
        const data = await this.ctx.indicatorManager.invokeAllProcesses('test');
        ctx.ok(data);
      } catch (err) {
        ctx.fail(err.message);
      }
    });
  }
}

class TestIndicator implements IIndicator {
  group: string = 'test';
  scope: IndicatorScope.PROCESS;
  async invoke(query: any) {
    return {
      query: query,
      processName: 'mock',
      ppid: (<any> process).ppid,
      pid: process.pid,
      title: process.title,
      argv: (<any> process).__pandoraOriginArgv || process.argv,
      execArgv: process.execArgv,
      debugPort: (<any> process).debugPort,
      execPath: process.execPath,
      uptime: process.uptime(),
    };
  }
}
