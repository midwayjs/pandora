import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';

import * as Debug from 'debug';

const debug = Debug('metrics:tcp');

const fs = require('fs');

const NetworkTraffic = [
  'TCP_ACTIVE_OPENS',   // active opening connections
  'TCP_PASSIVE_OPENS',  // passive opening connections
  'TCP_ATTEMPT_FAILS',  // number of failed connection attempts
  'TCP_ESTAB_RESETS',   // number of resets that have occurred at established
  'TCP_CURR_RESETS',   //  TCP_CURR_RESETS
  'TCP_IN_SEGS',            // incoming segments
  'TCP_OUT_SEGS',           // outgoing segments
  'TCP_RETRAN_SEGS',    // number of retran segements
  'TCP_IN_ERRS',           // incoming segments with errs, e_g_ checksum error
  'TCP_OUT_RSTS',          // outgoing segments with resets
];

export class NetworkTrafficGaugeSet extends CachedMetricSet {

  static DEFAULT_FILE_PATH = '/proc/net/snmp';

  filePath: string;

  networkTraffic = {};

  constructor(dataTTL = 5000, filePath = NetworkTrafficGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    for (let key of NetworkTraffic) {
      gauges.push({
        name: MetricName.build(key),
        metric: <Gauge<number>> {
          getValue() {
            self.refreshIfNecessary();
            return self.networkTraffic[key];
          }
        }
      });
    }
    return gauges;
  }

  getValueInternal() {
    const self = this;
    let snmp;
    try {
      snmp = fs.readFileSync(this.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    let columns;
    let index = 5;
    for (let line of snmp) {
      if (!(~line.indexOf('Tcp:'))) {
        continue;
      }
      columns = line.split(/\s/g);

      if (isNaN(parseInt(columns[1]))) {
        continue;
      }
      break;
    }

    for (let key of NetworkTraffic) {
      let value = columns[index++];
      self.networkTraffic[key] = parseInt(value);
    }
  }
}
