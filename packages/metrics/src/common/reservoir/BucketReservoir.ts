import {IReservoir} from '../Reservoir';
import {BucketCounter} from '../metrics/BucketCounter';
import {BucketSnapshot} from '../snapshot/BucketSnapshot';
import {Snapshot} from '../domain';

export class BucketReservoir implements IReservoir {

  private counterPerBucket: BucketCounter;
  private valuePerBucket: BucketCounter;
  private interval;

  constructor(interval: number, numberOfBucket: number, count: BucketCounter) {
    this.interval = interval;
    this.valuePerBucket = new BucketCounter(interval, numberOfBucket);
    this.counterPerBucket = count;
  }

  size(): number {
    return this.counterPerBucket.getCount();
  }

  update(value: number) {
    this.valuePerBucket.update(value);
  }

  getSnapshot(): Snapshot {
    let startTime = this.getNormalizedStartTime(Date.now());
    let valueResult = Array.from(this.valuePerBucket.getBucketCounts(startTime).values());
    let value = 0;
    if(valueResult.length) {
      value = valueResult[0];
    }
    let countResult = Array.from(this.counterPerBucket.getBucketCounts(startTime).values());
    let count = 0;
    if(countResult.length) {
      count = countResult[0];
    }

    return new BucketSnapshot(count, value);
  }

  protected getNormalizedStartTime(current) {
    return Math.floor((Math.floor(current / 1000) - this.interval) / this.interval) * this.interval * 1000;
  }

}
