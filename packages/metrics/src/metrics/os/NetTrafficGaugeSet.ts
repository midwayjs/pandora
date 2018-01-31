import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';
import * as fs from 'fs';
import { Mutex } from '../../util/Mutex';

const debug = require('debug')('metrics:net_traffic');

const fieldNames = ['net.in.bytes', 'net.in.packets', 'net.in.errs', 'net.in.dropped',
  'net.in.fifo.errs', 'net.in.frame.errs', 'net.in.compressed', 'net.in.multicast',
  'net.out.bytes', 'net.out.packets', 'net.out.errs', 'net.out.dropped',
  'net.out.fifo.errs', 'net.out.collisions', 'net.out.carrier.errs', 'net.out.compressed'];

// 不能用 map, 是空数组 ([ <16 empty items> ] 不会执行
const getEmptyFields = () => Array(16).fill(0);

export class NetTrafficGaugeSet extends CachedMetricSet {

  static DEFAULT_FILE_PATH = '/proc/net/dev';
  filePath: string;
  countStats = {};
  rateStats = {};
  fetching = false;
  mutex = new Mutex();
  stats = {};

  constructor(dataTTL = 5, filePath = NetTrafficGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    self.refreshIfNecessary();

    for (const interfaceName in this.stats) {
      let i = 0;

      for (const fieldName of fieldNames) {
        const index = i++;
        gauges.push({
          name: MetricName.build(`nettraffic.${interfaceName}.${fieldName}`),
          metric: <Gauge<number>> {
            getValue() {
              self.refreshIfNecessary();
              return self.stats[interfaceName].count[index];
            }
          }
        });

        gauges.push({
          name: MetricName.build(`nettraffic.${interfaceName}.${fieldName}.rate`),
          metric: <Gauge<number>> {
            getValue() {
              self.refreshIfNecessary();
              return self.stats[interfaceName].rate[index];
            }
          }
        });
      }
    }

    return gauges;
  }

  async refreshIfNecessary() {
    let current = Date.now();

    if (!this.lastCollectTime || current - this.lastCollectTime > this.dataTTL * 1000) {
      if (this.mutex.tryLock(3000)) {
        await this.getValueInternal();
        this.mutex.unlock();
      }

      await new Promise((resolve) => {
        this.mutex.wait(resolve);
      });

      // update the last collect time stamp
      this.lastCollectTime = current;
    }
  }

  getValueInternal() {

    let content;
    try {
      content = fs.readFileSync(this.filePath).toString().split('\n');
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

      if (!this.stats[interfaceName]) {
        this.stats[interfaceName] = {
          count: getEmptyFields(),
          rate: getEmptyFields()
        };
      }

      debug(`looping ${interfaceName}`);
      for (let i = 0; i < stats.length; i++) {
        const count = stats[i];
        const countStats = this.stats[interfaceName].count;
        const rateStats = this.stats[interfaceName].rate;
        const delta = count - countStats[i];
        countStats[i] = count;
        const duration = Date.now() - this.lastCollectTime;
        rateStats[i] = 1000.0 * delta / duration;
      }
    }
  }
}
