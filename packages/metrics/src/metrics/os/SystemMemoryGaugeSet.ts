import {CachedMetricSet} from '../../client/CachedMetricSet';
import {MetricName} from '../../common/MetricName';
import {Gauge} from '../../client/MetricsProxy';

import {startsWith, extractInt} from '../../util/IndicatorHelper';
import * as Debug from 'debug';
const debug = Debug('metrics:meminfo');
const fs = require('fs');

const SystemMemory = [
  'MEM.TOTAL',      // MemTotal
  'MEM.USED',       // MemTotal - (MemFree + Buffers + Cached)
  'MEM.FREE',       // MemFree
  'MEM.BUFFERS',    // Buffers
  'MEM.CACHED',     // Cached
  'MEM.SWAP.TOTAL', // SwapTotal
  'MEM.SWAP.USED',  // SwapTotal - SwapFree
  'MEM.SWAP.FREE'   // SwapFree
];


export class SystemMemoryGaugeSet extends CachedMetricSet {

  static DEFAULT_FILE_PATH = '/proc/meminfo';

  filePath: string;

  SystemMemory = {};

  constructor(dataTTL = 5000, filePath = SystemMemoryGaugeSet.DEFAULT_FILE_PATH) {
    super(dataTTL);
    this.filePath = filePath;
  }

  getMetrics() {
    let self = this;
    let gauges = [];

    for (let key of SystemMemory) {
      gauges.push({
        name: MetricName.build(key.toLowerCase()),
        metric: <Gauge<number>> {
          getValue() {
            self.refreshIfNecessary();
            return self.SystemMemory[key];
          }
        }
      });
    }
    return gauges;
  }

  getValueInternal() {

    let meminfo;
    try {
      meminfo = fs.readFileSync(this.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    for (let line of meminfo) {
      switch (true) {
        case startsWith(line, 'MemTotal:'):
          this.SystemMemory['MEM.TOTAL'] = extractInt(line);
          break;
        case startsWith(line, 'MemFree:'):
          this.SystemMemory['MEM.FREE'] = extractInt(line);
          break;
        case startsWith(line, 'Buffers:'):
          this.SystemMemory['MEM.BUFFERS'] = extractInt(line);
          break;
        case startsWith(line, 'Cached:'):
          this.SystemMemory['MEM.CACHED'] = extractInt(line);
          break;
        case startsWith(line, 'SwapTotal:'):
          this.SystemMemory['MEM.SWAP.TOTAL'] = extractInt(line);
          break;
        case startsWith(line, 'SwapFree:'):
          this.SystemMemory['MEM.SWAP.FREE'] = extractInt(line);
          break;
        default:
          break;
      }
    }

    this.SystemMemory['MEM.USED'] = this.SystemMemory['MEM.TOTAL']
      - this.SystemMemory['MEM.FREE']
      - this.SystemMemory['MEM.BUFFERS']
      - this.SystemMemory['MEM.CACHED'];

    this.SystemMemory['MEM.SWAP.USED'] = this.SystemMemory['MEM.SWAP.TOTAL']
      - this.SystemMemory['MEM.SWAP.FREE'];

  }
}
