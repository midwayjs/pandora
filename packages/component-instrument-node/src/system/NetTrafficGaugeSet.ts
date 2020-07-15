import * as fs from 'fs';
import { MetricObservableSet } from '../MetricObservableSet';

const debug = require('debug')('metrics:net_traffic');

const fieldNames = [
  'net_in_bytes',
  'net_in_packets',
  'net_in_errs',
  'net_in_dropped',
  'net_in_fifo_errs',
  'net_in_frame_errs',
  'net_in_compressed',
  'net_in_multicast',
  'net_out_bytes',
  'net_out_packets',
  'net_out_errs',
  'net_out_dropped',
  'net_out_fifo_errs',
  'net_out_collisions',
  'net_out_carrier_errs',
  'net_out_compressed',
];

// 不能用 map, 是空数组 ([ <16 empty items> ] 不会执行
const getEmptyFields = () => Array(16).fill(0);

export class NetTrafficGaugeSet extends MetricObservableSet {
  static DEFAULT_FILE_PATH = '/proc/net/dev';
  filePath: string = NetTrafficGaugeSet.DEFAULT_FILE_PATH;
  countStats = {};
  rateStats = {};
  fetching = false;
  stats = {};

  onSubscribe() {
    this.getValue();

    let i = 0;
    const interfaceNames = Object.keys(this.stats);

    for (const fieldName of fieldNames) {
      const index = i++;
      this.createObservables(
        `net_traffic_${fieldName}`,
        interfaceNames.map(iface => {
          return [
            { interface_name: iface },
            () => this.stats[iface].count[index],
          ];
        })
      );
      this.createObservables(
        `net_traffic_${fieldName}_rate`,
        interfaceNames.map(iface => {
          return [
            { interface_name: iface },
            () => this.stats[iface].rate[index],
          ];
        })
      );
    }
  }

  getValue() {
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
          rate: getEmptyFields(),
        };
      }

      debug(`looping ${interfaceName}`);
      for (let i = 0; i < stats.length; i++) {
        const count = stats[i];
        const countStats = this.stats[interfaceName].count;
        const rateStats = this.stats[interfaceName].rate;
        const delta = count - countStats[i];
        countStats[i] = count;
        rateStats[i] = (1000.0 * delta) / this.interval;
      }
    }
  }
}
