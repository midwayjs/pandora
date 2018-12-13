import {componentName, dependencies} from 'pandora-component-decorator';
import {EndPointManager} from '../actuator-server/EndPointManager';
import {MetricsEndPoint} from './MetricsEndPoint';
import {MetricsManager} from './MetricsManager';
import {MetricsIndicator} from './MetricsIndicator';
import {IndicatorManager} from '../indicator/IndicatorManager';

@componentName('metrics')
@dependencies(['actuatorServer', 'indicator'])
export default class ComponentMetrics {
  ctx: any;
  metricsManager: MetricsManager;
  metricsIndicator: MetricsIndicator;
  constructor(ctx) {

    this.ctx = ctx;

    this.metricsManager = new MetricsManager;
    ctx.metricsManager = this.metricsManager;

    const indicatorManager: IndicatorManager = ctx.indicatorManager;
    this.metricsIndicator = new MetricsIndicator(this.metricsManager);
    indicatorManager.register(this.metricsIndicator);

  }
  async startAtSupervisor() {
    const endPointManager: EndPointManager = this.ctx.endPointManager;
    endPointManager.register(new MetricsEndPoint(this.ctx));
  }
}

