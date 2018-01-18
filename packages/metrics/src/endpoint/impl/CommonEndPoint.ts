import {CacheDuplexEndPoint} from '../CacheDuplexEndPoint';
import {EndPoint} from '../EndPoint';
import {MetricsInjectionBridge} from '../../util/MetricsInjectionBridge';
import {ICounter, MetricLevel, MetricName} from '../../common';

export class ErrorEndPoint extends CacheDuplexEndPoint {
  group: string = 'error';
  private metricsManager = MetricsInjectionBridge.getMetricsManager();
  private counter: ICounter = this.metricsManager.getCounter('error', MetricName.build('error.all').setLevel(MetricLevel.MAJOR));

  processReporter(data, reply?) {
    super.processReporter(data, reply);
    if(data.appName) {
      this.counter.inc();
    }
  }
}

export class HealthEndPoint extends EndPoint {
  group: string = 'health';
}

export class ProcessEndPoint extends EndPoint {
  group: string = 'process';
}
