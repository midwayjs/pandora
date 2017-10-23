import {MetricSet} from '../common/MetricSet';

export abstract class CachedMetricSet extends MetricSet {

  static DEFAULT_DATA_TTL = 5000;

  // The time (in milli-seconds) to live of cached data
  dataTTL;

  // The last collect time
  lastCollectTime;

  constructor(dataTTL?) {
    super();
    this.dataTTL = dataTTL || CachedMetricSet.DEFAULT_DATA_TTL;
  }

  /**
   * Do not collect data if our cached copy of data is valid.
   * The purpose is to minimize the cost to collect system metric.
   */
  refreshIfNecessary() {
    let current = Date.now();

    if (!this.lastCollectTime || current - this.lastCollectTime > this.dataTTL) {
      this.getValueInternal();
      // update the last collect time stamp
      this.lastCollectTime = current;
    }
  }

  abstract getValueInternal();

}
