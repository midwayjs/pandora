import {ErrorLog, ErrorLogManagerOptions} from './domain';
import {EventEmitter} from 'events';

// 默认最多存储数据量
export const DEFAULT_POOL_SIZE = 1000;
// 默认 60s dump 一次数据
export const DEFAULT_INTERVAL = 60 * 1000;

export class ErrorLogManager extends EventEmitter {
  poolSize: number;
  interval: number;
  intervalId: NodeJS.Timer;
  running: boolean;
  pool: ErrorLog[] = [];
  constructor(options: ErrorLogManagerOptions) {
    super();
    this.poolSize = options.poolSize || DEFAULT_POOL_SIZE;
    this.interval = options.interval || DEFAULT_INTERVAL;
  }
  record(errorLog: ErrorLog) {
    this.pool.push(errorLog);
    this.tryToDump();
  }
  tryToDump() {
    if(this.pool.length >= this.poolSize) {
      this.dump();
    }
  }
  dump() {
    if(this.pool.length === 0) {
      return;
    }
    const dumped = Array.from(this.pool);
    this.pool.length = 0;
    this.emit('dump', dumped);
  }
  start(): void {
    if (!this.running) {
      this.running = true;
      this.intervalId = setInterval(() => {
        try {
          this.dump();
        } catch (err) {
          console.error(err);
        }
      }, this.interval);
    }
  }

  stop(): void {
    if (this.running) {
      this.running = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.dump();
    }
  }
}