import {Proxiable} from './domain';
import {MetricsConstants} from '../MetricsConstants';
import {MetricName} from '../common/MetricName';

export class MetricsProcessChannel {

  static instance;

  static getInstance() {
    if(!this.instance) {
      this.instance = new MetricsProcessChannel();
    }

    return this.instance;
  }

  register(group: string, name: MetricName | string, metric: Proxiable) {
    name = this.buildName(name);
    // register to real metrics manager
    if(global[MetricsConstants.GLOBAL_METRICS_KEY] && global[MetricsConstants.GLOBAL_METRICS_KEY].register) {
      global[MetricsConstants.GLOBAL_METRICS_KEY].register(group, name, metric);
    }
  }

  buildName(name: MetricName | string) {
    if(typeof name === 'string') {
      name = MetricName.build(<string>name);
    }

    return name;
  }
}
