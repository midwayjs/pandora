import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';

const fs = require('fs');
const os = require('os');
const {promisify} = require('util');
const exec = promisify(require('child_process').exec);

enum LoadAvg {
  ONE_MIN = 'ONE_MIN', FIVE_MIN = 'FIVE_MIN', FIFTEEN_MIN = 'FIFTEEN_MIN'
}

export class SystemLoadGaugeSet extends CachedMetricSet {

  static DEFAULT_FILE_PATH = '/proc/loadavg';

  filePath: string;

  loadAvg = {};

  getLoadAvgLinux() {
    try {
      let loadResult = fs.readFileSync(this.filePath).toString();
      let loadMatcher = loadResult.split(' ');

      if (loadMatcher.length >= 3) {
        this.loadAvg[LoadAvg.ONE_MIN] = 1 * loadMatcher[0];
        this.loadAvg[LoadAvg.FIVE_MIN] = 1 * loadMatcher[1];
        this.loadAvg[LoadAvg.FIFTEEN_MIN] = 1 * loadMatcher[2];
      } else {
        throw new Error('read load file error');
      }
    } catch (err) {
      this.loadAvg[LoadAvg.ONE_MIN] = 0;
      this.loadAvg[LoadAvg.FIVE_MIN] = 0;
      this.loadAvg[LoadAvg.FIFTEEN_MIN] = 0;
    }
  };

  async getLoadAvgDarwin() {
    let output;
    try {
      output = await exec('sysctl -n vm.loadavg');
    } catch (e) {
      throw new Error('failed to exec `sysctl -n vm.loadavg`');
    }

    const loadAvg = output.stdout.trim().replace(/{ | }/g, '').split(/ /).map(l => parseFloat(l));

    this.loadAvg[LoadAvg.ONE_MIN] = loadAvg[0];
    this.loadAvg[LoadAvg.FIVE_MIN] = loadAvg[1];
    this.loadAvg[LoadAvg.FIFTEEN_MIN] = loadAvg[2];
  };

  constructor(dataTTL = 5000, filePath = SystemLoadGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    gauges.push({
      name: MetricName.build('load.1min'),
      metric: <Gauge<Promise<number>>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.loadAvg[LoadAvg.ONE_MIN];
        }
      }
    });

    gauges.push({
      name: MetricName.build('load.5min'),
      metric: <Gauge<Promise<number>>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.loadAvg[LoadAvg.FIVE_MIN];
        }
      }
    });

    gauges.push({
      name: MetricName.build('load.15min'),
      metric: <Gauge<Promise<number>>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.loadAvg[LoadAvg.FIFTEEN_MIN];
        }
      }
    });

    return gauges;
  }

  async getValueInternal() {
    if (os.platform() === 'darwin') {
      await this.getLoadAvgDarwin();
    } else {
      this.getLoadAvgLinux();
    }
  }
}
