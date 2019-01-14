import {ErrorLog, ErrorLogManagerOptions} from './domain';
import {EventEmitter} from 'events';

export class ErrorLogManager extends EventEmitter {
  poolSize: number;
  interval: number;
  intervalId: NodeJS.Timer;
  running: boolean;
  pool: ErrorLog[] = [];
  constructor(options: ErrorLogManagerOptions) {
    super();
    this.poolSize = options.poolSize;
    this.interval = options.interval;
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
    try {
      this.emit('dump', dumped);
    } catch (err) {
      console.error(err);
    }
  }
  start(): void {
    if (!this.running) {
      this.running = true;
      this.intervalId = setInterval(() => {
        this.dump();
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