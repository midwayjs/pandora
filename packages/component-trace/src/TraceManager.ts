import { EventEmitter } from 'events';
import { consoleLogger } from 'pandora-dollar';
import { TraceData } from './TraceData';
import { IPandoraSpan, TraceManagerOptions } from './domain';
import { SPAN_FINISHED, TraceStatus, TRACE_DATA_DUMP } from './constants';

// 默认最多存储数据量
export const DEFAULT_POOL_SIZE = 1000;
// 默认 60s dump 一次数据
export const DEFAULT_INTERVAL = 60 * 1000;
// 默认慢链路阈值
export const DEFAULT_SLOW_THRESHOLD = 10 * 1000;

export class TraceManager extends EventEmitter {
  private options: TraceManagerOptions;
  private pool: Map<string, TraceData> = new Map();
  private poolSize: number;
  private interval: number;
  private intervalId: NodeJS.Timer;
  private slowThreshold: number;
  private running: boolean = false;

  constructor(options: TraceManagerOptions = {}) {
    super();
    this.poolSize = options.poolSize || DEFAULT_POOL_SIZE;
    this.interval = options.interval || DEFAULT_INTERVAL;
    this.slowThreshold = options.slowThreshold || DEFAULT_SLOW_THRESHOLD;
    this.options = options;
  }

  list(): TraceData[] {
    return Array.from(this.pool.values());
  }

  record(span: IPandoraSpan, isEntry: boolean): void {
    if (isEntry) {
      this.recordEntrySpan(span);
    } else {
      const traceId = span.traceId;
      const traceData = this.pool.get(traceId);
      traceData.putSpan(span);
    }
  }

  recordEntrySpan(span: IPandoraSpan): void {
    const options = this.options;
    const traceId = span.traceId;
    const timestamp = span.startTime;

    if (this.pool.has(traceId)) {
      consoleLogger.warn(`Entry [${traceId}] was duplicated in pool, skip this span, please check!`);
      return;
    }

    const traceName = options.traceName ? options.traceName(span) : span.traceName;
    const traceData = new TraceData();
    traceData.setTraceId(traceId);
    traceData.setTraceName(traceName);
    traceData.setTimestamp(timestamp);
    traceData.putSpan(span);

    span.on(SPAN_FINISHED, (span: IPandoraSpan) => {
      const duration = span.duration;
      traceData.setDuration(duration);

      if (duration >= this.slowThreshold) {
        traceData.setStatus(TraceStatus.Slow);
      } else if (span.error) {
        traceData.setStatus(TraceStatus.Error);
      } else {
        traceData.setStatus(TraceStatus.Normal);
      }
    });

    const size = this.pool.size;

    if (size >= this.poolSize) {
      this.dump(false);
    }

    this.pool.set(traceId, traceData);
  }

  dump(dumpAll?: boolean): void {
    const dumped: TraceData[] = [];
    const unfinished: TraceData[] = [];

    for (const traceData of this.pool.values()) {
      if (!dumpAll && traceData.getStatus() === TraceStatus.Unfinished) {
        unfinished.push(traceData);
      } else {
        dumped.push(traceData);
      }
    }

    this.emit(TRACE_DATA_DUMP, dumped);
    this.pool.clear();

    if (!dumpAll) {
      unfinished.forEach((item) => {
        this.pool.set(item.getTraceId(), item);
      });
    }
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