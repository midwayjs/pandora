import {MetricSet} from '../common/MetricSet';
import {Mutex} from '../util/Mutex';

export abstract class CachedMetricSet extends MetricSet {

  static DEFAULT_DATA_TTL = 60;

  // The time (in milli-seconds) to live of cached data
  dataTTL;

  // The last collect time
  lastCollectTime;

  mutex = new Mutex();

  constructor(dataTTL?) {
    super();
    this.dataTTL = dataTTL || CachedMetricSet.DEFAULT_DATA_TTL;
  }

  /**
   * Do not collect data if our cached copy of data is valid.
   * The purpose is to minimize the cost to collect system metric.
   */
  async refreshIfNecessary() {
    let current = Date.now();

    if (!this.lastCollectTime || current - this.lastCollectTime > this.dataTTL * 1000) {
      if (this.mutex.tryLock(3000)) {
        await this.getValueInternal();
        this.mutex.unlock();
      } else {
        await new Promise((resolve) => {
          this.mutex.wait(resolve);
        });
      }

      // update the last collect time stamp
      this.lastCollectTime = current;
    }
  }

  abstract getValueInternal();

}
