import { startsWith, extractInt } from '@pandorajs/dollar';
import fs = require('fs');
import * as Debug from 'debug';
import { MetricObservableSet } from '../MetricObservableSet';
const debug = Debug('metrics:meminfo');

const SystemMemory = [
  'MEM_TOTAL', // MemTotal
  'MEM_USED', // MemTotal - (MemFree + Buffers + Cached)
  'MEM_FREE', // MemFree
  'MEM_BUFFERS', // Buffers
  'MEM_CACHED', // Cached
  'MEM_SWAP_TOTAL', // SwapTotal
  'MEM_SWAP_USED', // SwapTotal - SwapFree
  'MEM_SWAP_FREE', // SwapFree
];

export class SystemMemoryGaugeSet extends MetricObservableSet {
  static DEFAULT_FILE_PATH = '/proc/meminfo';

  filePath = SystemMemoryGaugeSet.DEFAULT_FILE_PATH;

  systemMemory = {};

  onSubscribe() {
    for (const key of SystemMemory) {
      this.createObservable(
        key.toLowerCase(),
        () => this.systemMemory[key],
        {}
      );
    }

    this.createObservable(
      'mem_usage',
      () => this.systemMemory['MEM_USED'] / this.systemMemory['MEM_TOTAL'],
      {}
    );
  }

  getValue() {
    let meminfo;
    try {
      meminfo = fs.readFileSync(this.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    for (const line of meminfo) {
      switch (true) {
        case startsWith(line, 'MemTotal:'):
          this.systemMemory['MEM.TOTAL'] = extractInt(line);
          break;
        case startsWith(line, 'MemFree:'):
          this.systemMemory['MEM.FREE'] = extractInt(line);
          break;
        case startsWith(line, 'Buffers:'):
          this.systemMemory['MEM.BUFFERS'] = extractInt(line);
          break;
        case startsWith(line, 'Cached:'):
          this.systemMemory['MEM.CACHED'] = extractInt(line);
          break;
        case startsWith(line, 'SwapTotal:'):
          this.systemMemory['MEM.SWAP.TOTAL'] = extractInt(line);
          break;
        case startsWith(line, 'SwapFree:'):
          this.systemMemory['MEM_SWAP_FREE'] = extractInt(line);
          break;
        default:
          break;
      }
    }

    this.systemMemory['MEM_USED'] =
      this.systemMemory['MEM_TOTAL'] -
      this.systemMemory['MEM_FREE'] -
      this.systemMemory['MEM_BUFFERS'] -
      this.systemMemory['MEM_CACHED'];

    this.systemMemory['MEM_SWAP_USED'] =
      this.systemMemory['MEM_SWAP_TOTAL'] - this.systemMemory['MEM_SWAP_FREE'];
  }
}
