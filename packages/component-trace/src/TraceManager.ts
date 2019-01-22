import { EventEmitter } from 'events';
import { consoleLogger } from 'pandora-dollar';
import { TraceData } from './TraceData';
import { IPandoraSpan, TraceManagerOptions, ITracer, SamplingFunction } from './domain';
import { SPAN_FINISHED, TraceStatus, TRACE_DATA_DUMP, SPAN_CREATED } from './constants';

// 默认最多存储数据量
export const DEFAULT_POOL_SIZE = 1000;
// 默认 60s dump 一次数据
export const DEFAULT_INTERVAL = 60 * 1000;
// 默认慢链路阈值
export const DEFAULT_SLOW_THRESHOLD = 10 * 1000;
// 默认链路超时阈值
export const DEFAULT_TIMEOUT = 30 * 1000;
// 默认采样率
export const DEFAULT_SAMPLING = 100;

export class TraceManager extends EventEmitter {
  private options: TraceManagerOptions;
  private pool: Map<string, TraceData> = new Map();
  private poolSize: number;
  private interval: number;
  private intervalId: NodeJS.Timer;
  private slowThreshold: number;
  private sampling: number | SamplingFunction;
  private timeout: number;
  private running: boolean = false;
  private _tracer: ITracer;

  constructor(options: TraceManagerOptions = {}) {
    super();
    this.poolSize = options.poolSize || DEFAULT_POOL_SIZE;
    this.interval = options.interval || DEFAULT_INTERVAL;
    this.slowThreshold = options.slowThreshold || DEFAULT_SLOW_THRESHOLD;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.sampling = options.sampling || DEFAULT_SAMPLING;
    this.options = options;
    const Tracer = options.kTracer;

    if (Tracer) {
      this._tracer = new Tracer();
      this._tracer.on(SPAN_CREATED, (span) => {
        this.record(span, span.isEntry);
      });
    }
  }

  get tracer(): ITracer {
    return this._tracer;
  }

  list(): TraceData[] {
    return Array.from(this.pool.values());
  }

  random(): number {
    return Math.random();
  }

  isSampled(span: IPandoraSpan): boolean {
    if (typeof this.sampling === 'function') {
      return this.sampling(span);
    }

    const rate = this.sampling / 100;

    return this.random() <= rate;
  }

  record(span: IPandoraSpan, isEntry: boolean): void {
    if (isEntry) {
      this.recordEntrySpan(span);
    } else {
      const traceId = span.traceId;
      const traceData = this.pool.get(traceId);

      if (traceData) {
        traceData.putSpan(span);
      } else {
        consoleLogger.warn(`[TraceManager] trace maybe timeout and dumped, skip this span, please check!`);
      }
    }
  }

  recordEntrySpan(span: IPandoraSpan): void {
    const options = this.options;
    const traceId = span.traceId;
    const timestamp = span.startTime;

    if (this.pool.has(traceId)) {
      consoleLogger.warn(`[TraceManager] entry [${traceId}] was duplicated in pool, skip this span, please check!`);
      return;
    }

    if (!this.isSampled(span)) {
      consoleLogger.warn(`[TraceManager] entry [${traceId}] can't record by sampling.`);
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
      } else if (span.tag('error')) {
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
      if (
        !dumpAll &&
        traceData.getStatus() === TraceStatus.Unfinished &&
        !traceData.isTimeout(this.timeout)
        ) {
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
          this.dump(false);
        } catch (error) {
          consoleLogger.error('[TraceManager] interval dump data error. ', error);
        }
      }, this.interval);
    }
  }

  stop(): void {
    if (this.running) {
      this.running = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      try {
        this.dump(true);
      } catch (error) {
        consoleLogger.error('[TraceManager] dump data before stop error. ', error);
      }
    }
  }
}