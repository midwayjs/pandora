import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import * as fs from 'fs';

const debug = require('debug')('metrics:net_traffic');

const fieldNames = ['net.in.bytes', 'net.in.packets', 'net.in.errs', 'net.in.dropped',
  'net.in.fifo.errs', 'net.in.frame.errs', 'net.in.compressed', 'net.in.multicast',
  'net.out.bytes', 'net.out.packets', 'net.out.errs', 'net.out.dropped',
  'net.out.fifo.errs', 'net.out.collisions', 'net.out.carrier.errs', 'net.out.compressed'];

const getEmptyFields = () => Array(16).map(() => 0);


export class NetTrafficGaugeSet extends CachedMetricSet {


  static DEFAULT_FILE_PATH: '/proc/net/dev';


  filePath: string;

  countStats = {};
  rateStats = {};


  constructor(dataTTL = 5000, filePath = NetTrafficGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    self.refreshIfNecessary();

    for (const interfaceName in this.countStats) {
      let i = 0;
      for (const fieldName of fieldNames) {
        gauges.push({
          name: MetricName.build(`nettraffic.${interfaceName}.${fieldName}`),
          metric: <Gauge<number>> {
            getValue() {
              return self.countStats[interfaceName][i++]
            }
          }
        });
      }
    }

    return gauges;
  }

  getValueInternal() {


    const self = this;
    let content;
    try {
      content = fs.readFileSync(self.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    content = content.slice(2);

    debug(content);

    for (let line of content) {

      line = line.trim();

      if (line === '') {
        break; // end of file
      }

      const parts = line.split(':');
      let interfaceName = parts[0];
      interfaceName = interfaceName.trim();
      let stats = parts[1];
      stats = stats.split(/\s+/gi).map(stat => parseInt(stat, 10));

      if (!this.countStats[interfaceName]) {
        this.countStats[interfaceName] = getEmptyFields();
        this.rateStats[interfaceName] = getEmptyFields();
      }

      debug(`looping ${interfaceName}`);
      for (let i = 0; i < stats.length;) {

        const count = stats[i];
        const delta = count - this.countStats[interfaceName][i];
        this.countStats[interfaceName][i] = count;
        const duration = Date.now() - this.lastCollectTime;
        this.rateStats[interfaceName][i] = 1000.0 * delta / duration;
        i++;
      }
    }
  }
}
