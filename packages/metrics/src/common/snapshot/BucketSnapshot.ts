import {Constants} from '../Constants';
import {Snapshot} from '../domain';

export class BucketSnapshot implements Snapshot {

  private count;
  private value;

  constructor(count = 0, value = 0) {
    this.count = count;
    this.value = value;
  }

  getValue(quantile: number) {
    return Constants.NOT_AVAILABLE;
  }

  getValues(): number[] {
    return [];
  }

  size(): number {
    return this.count;
  }

  getMedian(): number {
    return Constants.NOT_AVAILABLE;
  }

  get75thPercentile(): number {
    return Constants.NOT_AVAILABLE;
  }

  get95thPercentile(): number {
    return Constants.NOT_AVAILABLE;
  }

  get98thPercentile(): number {
    return Constants.NOT_AVAILABLE;
  }

  get99thPercentile(): number {
    return Constants.NOT_AVAILABLE;
  }

  get999thPercentile(): number {
    return Constants.NOT_AVAILABLE;
  }

  getMax(): number {
    return Constants.NOT_AVAILABLE;
  }

  getMean(): number {
    if (this.count === 0) {
      return 0;
    }
    return this.value / this.count;
  }

  getMin(): number {
    return Constants.NOT_AVAILABLE;
  }

  getStdDev(): number {
    return Constants.NOT_AVAILABLE;
  }


}
