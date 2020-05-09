import {MetricName, BaseGauge} from 'metrics-common';
import fs = require('fs');
import os = require('os');
import {promisify} from 'util';
import {CachedMetricSet} from '@pandorajs/metrics-util';
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
        this.loadAvg[LoadAvg.ONE_MIN] = parseFloat(loadMatcher[0]);
        this.loadAvg[LoadAvg.FIVE_MIN] = parseFloat(loadMatcher[1]);
        this.loadAvg[LoadAvg.FIFTEEN_MIN] = parseFloat(loadMatcher[2]);
      } else {
        throw new Error('read load file error');
      }
    } catch (err) {
      this.loadAvg[LoadAvg.ONE_MIN] = 0;
      this.loadAvg[LoadAvg.FIVE_MIN] = 0;
      this.loadAvg[LoadAvg.FIFTEEN_MIN] = 0;
    }
  }

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
  }

  constructor(dataTTL = 5, filePath = SystemLoadGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    gauges.push({
      name: MetricName.build('load.1min'),
      metric: <BaseGauge<Promise<number>>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.loadAvg[LoadAvg.ONE_MIN];
        }
      }
    });

    gauges.push({
      name: MetricName.build('load.5min'),
      metric: <BaseGauge<Promise<number>>> {
        async getValue() {
          await self.refreshIfNecessary();
          return self.loadAvg[LoadAvg.FIVE_MIN];
        }
      }
    });

    gauges.push({
      name: MetricName.build('load.15min'),
      metric: <BaseGauge<Promise<number>>> {
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
