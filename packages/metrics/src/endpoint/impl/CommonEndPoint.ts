import {CacheDuplexEndPoint} from '../CacheDuplexEndPoint';
import {EndPoint} from '../EndPoint';
import {MetricsInjectionBridge} from '../../util/MetricsInjectionBridge';
import {BucketCounter, ICounter, MetricName} from '../../common';

export class ErrorEndPoint extends CacheDuplexEndPoint {
  group: string = 'error';
  counter: ICounter;

  constructor() {
    super();
    this.counter = new BucketCounter(5);
    let metricsManager = MetricsInjectionBridge.getMetricsManager();
    metricsManager.register('error', MetricName.build('error.all'), this.counter);
  }

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
