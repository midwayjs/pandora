import {MetricType} from '../MetricType';
import {EWMA} from '../util/EWMA';
import {BucketCounter} from './BucketCounter';
import {Metered, Metric} from '../domain';

/**
 * A meter metric which measures mean throughput and one-, five-, and fifteen-minute
 * exponentially-weighted moving average throughput.
 * 一种用于度量一段时间内吞吐率的计量器。例如，一分钟内，五分钟内，十五分钟内的qps指标，
 * 这段时间内的吞吐率通过指数加权的方式计算移动平均得出。
 */
export interface IMeter extends Metric, Metered {

  /**
   * Mark the occurrence of an event.
   * 标记一次事件
   */
  mark(): void;
  /**
   * Mark the occurrence of a given number of events.
   * 标记n次事件
   *
   * @param n the number of events
   */
  mark(n: number): void;
}

const DEFAULT_NUM_OF_BUCKET = 10;
const TICK_INTERVAL = 5000;  // 5s

/**
 * A meter metric which measures mean throughput and one-, five-, and fifteen-minute
 * exponentially-weighted moving average throughputs.
 *
 * @see EWMA
 */
export class BaseMeter implements IMeter {

  type = MetricType.METER;
  m1Rate = EWMA.oneMinuteEWMA();
  m5Rate = EWMA.fiveMinuteEWMA();
  m15Rate = EWMA.fifteenMinuteEWMA();
  startTime;
  lastTick;
  uncounted = 0;
  bucketCounter: BucketCounter;

  constructor(interval = 1, numberOfBucket = DEFAULT_NUM_OF_BUCKET) {
    this.startTime = this.lastTick = Date.now();
    this.bucketCounter = new BucketCounter(interval, numberOfBucket);
  }

  private tickIfNecessary() {
    let newTick = Date.now();
    let oldTick = this.lastTick;
    let age = newTick - oldTick;
    if (age > TICK_INTERVAL) {
      let newIntervalStartTick = newTick - age % TICK_INTERVAL;
      if (oldTick < newIntervalStartTick) {
        this.lastTick = newIntervalStartTick;
        let requiredTicks = age / TICK_INTERVAL;
        for (let i = 0; i < requiredTicks; i++) {
          this.m1Rate.tick(this.uncounted);
          this.m5Rate.tick(this.uncounted);
          this.m15Rate.tick(this.uncounted);
          this.uncounted = 0;
        }
      }
    }
  }

  mark(n: number = 1): void {
    this.tickIfNecessary();
    this.uncounted += n;
    this.bucketCounter.update(n);
  }

  getCount(): number {
    return this.bucketCounter.getCount();
  }

  getInstantCount(startTime?: number): Map<number, number> {
    return this.bucketCounter.getBucketCounts(startTime);
  }

  getInstantCountInterval(): number {
    return this.bucketCounter.getBucketInterval();
  }

  getFifteenMinuteRate(): number {
    this.tickIfNecessary();
    return this.m15Rate.getRate();
  }

  getFiveMinuteRate(): number {
    this.tickIfNecessary();
    return this.m5Rate.getRate();
  }

  getMeanRate(): number {
    if(this.getCount() === 0) {
      return 0;
    }

    let elapsed = Date.now() - this.startTime;
    return this.getCount() / elapsed * 1000;
  }

  getOneMinuteRate(): number {
    this.tickIfNecessary();
    return this.m1Rate.getRate();
  }

}
