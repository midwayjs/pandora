import {IReservoir, ReservoirType} from '../Reservoir';
import {MetricType} from '../MetricType';
import {BucketCounter} from './BucketCounter';
import {UniformReservoir} from '../reservoir/UniformReservoir';
import {ExponentiallyDecayingReservoir} from '../reservoir/ExponentiallyDecayingReservoir';
import {BucketReservoir} from '../reservoir/BucketReservoir';
import {Counting, Metric, Sampling, Snapshot} from '../domain';

/**
 * A metric which calculates the distribution of a value.
 * 直方分布指标，例如，可以用于统计某个接口的响应时间，可以展示50%, 70%, 90%的请求响应时间落在哪个区间内
 *
 * @see <a href="http://www.johndcook.com/standard_deviation.html">Accurately computing running
 *      variance</a>
 */
export interface IHistogram extends Metric, Sampling, Counting {

  /**
   * Adds a recorded value.
   * 将某个整型值添加到
   *
   * @param value the length of the value
   */
  update(value: number);

}

export class BaseHistogram implements IHistogram {

  reservoir: IReservoir;
  type = MetricType.HISTOGRAM;
  count: BucketCounter;

  constructor(type: ReservoirType | IReservoir = ReservoirType.EXPONENTIALLY_DECAYING, interval = 10, numberOfBucket = 10) {
    this.count = new BucketCounter(interval, numberOfBucket);
    if(typeof type === 'object') {
      this.reservoir = type; // || new EDS(1028, 0.015);
    } else {
      switch (type) {
        case ReservoirType.EXPONENTIALLY_DECAYING:
          this.reservoir = new ExponentiallyDecayingReservoir();
          break;
        // case ReservoirType.SLIDING_TIME_WINDOW:
        //   this.reservoir = new SlidingTimeWindowReservoir(interval);
        //   break;
        // case ReservoirType.SLIDING_WINDOW:
        //   this.reservoir = new SlidingWindowReservoir(1024);
        //   break;
        case ReservoirType.UNIFORM:
          this.reservoir = new UniformReservoir(1024);
          break;
        case ReservoirType.BUCKET:
          this.reservoir = new BucketReservoir(interval, numberOfBucket, this.count);
          break;
        default:
          this.reservoir = new ExponentiallyDecayingReservoir();
      }}
  }


  update(value: number) {
    this.count.update();
    this.reservoir.update(value);
  }

  getCount(): number {
    return this.count.getCount();
  }

  getSnapshot(): Snapshot {
    return this.reservoir.getSnapshot();
  }

}
