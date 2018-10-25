import { Bucket, BucketDeque, IBucketCounter } from './BucketCounter';
import { ICounter } from './Counter';
import { MetricType } from '../MetricType';
import { Long } from '../../domain';

const BigNumber = require("long");

export class LongBucketDeque extends BucketDeque {
  protected createQueueItem(): Bucket {
    return {
      timestamp: -1,
      count: new BigNumber(),
    };
  }
}

export class LongBaseCounter implements ICounter {

  count: Long = new BigNumber();
  type = MetricType.COUNTER;

  dec(n: number = 1) {
    this.count = this.count.sub(n);
  }

  inc(n: number = 1) {
    this.count = this.count.add(n);
  }

  getCount(): string {
    return this.count.toString();
  }

  clear() {
    this.count = new BigNumber();
  }
}

export class LongBucketCounter extends LongBaseCounter implements IBucketCounter {

  /**
   * 保存从创建开始累积的计数
   */
  private totalCount: ICounter = new LongBaseCounter();

  /**
   * 保存最近N次的精确计数, 采用环形队列避免数据的挪动
   */
  private buckets: LongBucketDeque;

  /**
   * 是否更新总次数
   */
  private updateTotalCount: boolean = false;

  /**
   * 每一次精确计数的之间的时间间隔，单位秒
   * 只能是 1，5，10, 30, 60 这几个数字
   */
  private interval;

  constructor(interval = 1, numberOfBucket = 10, updateTotalCount = true) {
    super();
    this.interval = interval;
    this.buckets = new LongBucketDeque(numberOfBucket + 1);
    this.updateTotalCount = updateTotalCount;
  }

  getBucketCounts(startTime = 0): Map<number, Long> {
    let counts: Map<number, Long> = new Map();
    let curTs = this.calculateCurrentTimestamp(Date.now());

    for (let bucket of this.buckets.getBucketList()) {
      if (1000 * bucket.timestamp >= startTime && bucket.timestamp <= curTs) {
        counts.set(bucket.timestamp * 1000, bucket.count);
      }
    }
    return counts;
  }

  getBucketCountsValues(startTime = 0): Map<number, string> {
    const maps = this.getBucketCounts(startTime);
    const newMaps = new Map();

    maps.forEach((value, key) => {
      newMaps.set(key, value.toString());
    });
    return newMaps;
  }

  private calculateCurrentTimestamp(timestamp: number) {
    // transform to seconds and discard fractional part
    return Math.floor(Math.floor(timestamp / 1000) / this.interval) * this.interval;
  }

  getBucketInterval() {
    return this.interval;
  }

  update(n = 1) {
    if (this.updateTotalCount) {
      this.totalCount.inc(n);
    }

    let curTs = this.calculateCurrentTimestamp(Date.now());
    let lastBucket = this.buckets.peek();

    if (curTs > lastBucket.timestamp) {
      // create a new bucket and evict the oldest one
      let newBucket: Bucket = {
        count: new BigNumber(),
        timestamp: curTs
      };

      this.buckets.addLast(newBucket);
      lastBucket = newBucket;
    }
    lastBucket.count = (<Long>lastBucket.count).add(n);
  }

  getCount(): string {
    return <string>this.totalCount.getCount();
  }

  inc(n?) {
    this.update(n);
  }

  dec(n = 1) {
    this.update(-n);
  }

}
