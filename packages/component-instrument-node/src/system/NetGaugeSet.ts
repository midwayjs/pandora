import * as si from 'systeminformation';
import { SystemMetric, SystemAttribute } from '@pandorajs/semantic-conventions';
import { MetricObservableSet } from '../MetricObservableSet';

const metricMap: {
  [key in keyof typeof SystemMetric]?: keyof si.Systeminformation.NetworkStatsData;
} = {
  [SystemMetric.NET_IN_BYTES]: 'rx_bytes',
  [SystemMetric.NET_IN_ERRS]: 'rx_errors',
  [SystemMetric.NET_OUT_BYTES]: 'tx_bytes',
  [SystemMetric.NET_OUT_ERRS]: 'tx_errors',
};

type ValueType = si.Systeminformation.NetworkStatsData[];
export class NetGaugeSet extends MetricObservableSet<ValueType> {
  onSubscribe() {
    for (const [metric, key] of Object.entries(metricMap)) {
      this.createValueObserver(metric, value => {
        return value.map(it => {
          return [
            it[key] as number,
            {
              [SystemAttribute.NET_IFACE]: it.iface,
            },
          ];
        });
      });
    }
  }

  async getValue() {
    return si.networkStats();
  }
}
