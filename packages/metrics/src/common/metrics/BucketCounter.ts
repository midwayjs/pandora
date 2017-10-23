import {BaseCounter, ICounter} from './Counter';
import {MetricType} from '../MetricType';

/**
 * 提供分桶计数功能，每个桶统计一定时间间隔内的计数。
 * BucketCounter只保留最近N个时间间隔内的计数，再老的会被丢弃。
 * 同时保存从创建开始到现在的累计计数。
 */
export interface IBucketCounter extends ICounter {

  /**
   * update the counter to the given bucket
   */
  update(n?);

  /**
   * Return the bucket count, keyed by timestamp
   * @return the bucket count, keyed by timestamp
   */
  getBucketCounts();

  /**
   * Return the bucket count, keyed by timestamp, since (including) the startTime.
   * 返回从startTime开始的分桶统计功能
   * @param startTime 查询起始时间, 单位是毫秒
   * @return the bucket count, keyed by timestamp
   */
  getBucketCounts(startTime);

  /**
   * Get the interval of the bucket
   * @return the interval of the bucket
   */
  getBucketInterval();
}

interface Bucket {
  timestamp;
  count;
}

class BucketDeque {

  private queue: Array<Bucket> = [];

  private current = 0;

  private size = 11;

  constructor(length = 11) {
    this.size = length;
    // init buckets
    for (let i = 0; i < length; i++) {
      this.queue[i] = {
        timestamp: -1,
        count: 0,
      };
    }
  }

  addLast(e: Bucket) {
    this.current = (this.current + 1) % this.size;
    this.queue[this.current] = e;
  }

  peek(): Bucket {
    return this.queue[this.current];
  }

  /**
   * Example1:
   *      10:00   10:01  10:02   09:57   09:58   09:59
   *      70      80     90      40      50      60
   *              |       \
   *            startPos  latestIndex
   * Example2:
   *      10:00   09:55  09:56   09:57   09:58   09:59
   *      70      20     30      40      50      60
   *      |                                      |
   *      latestIndex                            startPos
   */
  getBucketList(): Array<Bucket> {
    let length = this.queue.length - 1;
    let bucketList: Array<Bucket> = [];
    let startPos = this.current;
    let startTs = this.queue[this.current].timestamp;
    if (startPos < 0) {
      startPos = 0;
    }
    for (let i = startPos; i >= 0 && startPos - i < length; i--) {
      bucketList.push(this.queue[i]);
    }
    for (let i = length; i > startPos + 1; i--) {
      if (this.queue[i].timestamp > startTs) {
        // the current index has been update during this iteration
        // therefore the data shall not be collected
      } else {
        bucketList.push(this.queue[i]);
      }
    }
    return bucketList;
  }
}


export class BucketCounter extends BaseCounter implements IBucketCounter {

  type = MetricType.COUNTER;

  /**
   * 保存从创建开始累积的计数
   */
  private totalCount: BaseCounter;

  /**
   * 保存最近N次的精确计数, 采用环形队列避免数据的挪动
   */
  private buckets: BucketDeque;

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
    this.totalCount = new BaseCounter();
    this.interval = interval;
    this.buckets = new BucketDeque(numberOfBucket + 1);
    this.updateTotalCount = updateTotalCount;
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
        count: 0,
        timestamp: curTs
      };

      this.buckets.addLast(newBucket);
      lastBucket = newBucket;
    }
    lastBucket.count += n;
  }

  /**
   * Return the bucket count, keyed by timestamp
   * @return the bucket count, keyed by timestamp
   */
  getBucketCounts(startTime = 0): Map<number, number> {
    let counts: Map<number, number> = new Map();
    let curTs = this.calculateCurrentTimestamp(Date.now());
    for (let bucket of this.buckets.getBucketList()) {
      if (1000 * bucket.timestamp >= startTime && bucket.timestamp <= curTs) {
        counts.set(bucket.timestamp * 1000, bucket.count);
      }
    }
    return counts;
  }

  private calculateCurrentTimestamp(timestamp: number) {
    // transform to seconds and discard fractional part
    return Math.floor(Math.floor(timestamp / 1000) / this.interval) * this.interval;
  }

  getCount() {
    return this.totalCount.getCount();
  }

  inc(n?) {
    this.update(n);
  }

  dec(n = 1) {
    this.update(-n);
  }

  getBucketInterval() {
    return this.interval;
  }

}
