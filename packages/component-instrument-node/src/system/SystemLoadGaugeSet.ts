import fs = require('fs');
import os = require('os');
import { promisify } from 'util';
import { MetricObservableSet } from '../MetricObservableSet';
const exec = promisify(require('child_process').exec);

enum LoadAvg {
  ONE_MIN,
  FIVE_MIN,
  FIFTEEN_MIN,
}

export class SystemLoadGaugeSet extends MetricObservableSet {
  static DEFAULT_FILE_PATH = '/proc/loadavg';

  filePath: string = SystemLoadGaugeSet.DEFAULT_FILE_PATH;

  loadAvg = {};

  getLoadAvgLinux() {
    try {
      const loadResult = fs.readFileSync(this.filePath).toString();
      const loadMatcher = loadResult.split(' ');

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

    const loadAvg = output.stdout
      .trim()
      .replace(/{ | }/g, '')
      .split(/ /)
      .map(l => parseFloat(l));

    this.loadAvg[LoadAvg.ONE_MIN] = loadAvg[0];
    this.loadAvg[LoadAvg.FIVE_MIN] = loadAvg[1];
    this.loadAvg[LoadAvg.FIFTEEN_MIN] = loadAvg[2];
  }

  onSubscribe() {
    this.createObservable(
      'system_cpu_load_1min',
      () => this.loadAvg[LoadAvg.ONE_MIN],
      {}
    );
    this.createObservable(
      'system_cpu_load_5min',
      () => this.loadAvg[LoadAvg.FIVE_MIN],
      {}
    );
    this.createObservable(
      'system_cpu_load_15min',
      () => this.loadAvg[LoadAvg.FIFTEEN_MIN],
      {}
    );
  }

  async getValue() {
    if (os.platform() === 'darwin') {
      await this.getLoadAvgDarwin();
    } else {
      this.getLoadAvgLinux();
    }
  }
}
