import {MetricType} from '../MetricType';
import {IReservoir, ReservoirType} from '../Reservoir';
import {BaseMeter, IMeter} from './Meter';
import {BaseHistogram, IHistogram} from './Histogram';
import {Metered, Sampling, Snapshot} from '../domain';

/**
 * A timer metric which aggregates timing durations and provides duration statistics, plus
 * throughput statistics via {@link BaseMeter}.
 * Timer相当于Meter+Histogram的组合，同时统计一段代码，一个方法的qps，以及执行时间的分布情况
 */
export interface ITimer extends Metered, Sampling {

  /**
   * Adds a recorded duration.
   *
   * @param duration the length of the duration
   */
  update(duration: number);

}

/**
 * A timer metric which aggregates timing durations and provides duration statistics, plus
 * throughput statistics via {@link Meter}.
 */
export class BaseTimer implements ITimer {
  type = MetricType.TIMER;
  meter: IMeter;
  histogram: IHistogram;

  constructor(interval = 60, reservoir: ReservoirType | IReservoir = ReservoirType.EXPONENTIALLY_DECAYING) {
    this.meter = new BaseMeter(interval);
    this.histogram = new BaseHistogram(reservoir, interval, 10);
  }

  getCount() {
    return <number>this.histogram.getCount();
  }

  getFifteenMinuteRate() {
    return this.meter.getFifteenMinuteRate();
  }

  getFiveMinuteRate() {
    return this.meter.getFiveMinuteRate();
  }

  getMeanRate() {
    return this.meter.getMeanRate();
  }

  getOneMinuteRate() {
    return this.meter.getOneMinuteRate();
  }

  getSnapshot(): Snapshot {
    return this.histogram.getSnapshot();
  }

  getInstantCountInterval() {
    return this.meter.getInstantCountInterval();
  }

  getInstantCount(startTime?) {
    return this.meter.getInstantCount(startTime);
  }

  update(duration) {
    if (duration >= 0) {
      this.histogram.update(duration);
      this.meter.mark();
    }
  }
}
