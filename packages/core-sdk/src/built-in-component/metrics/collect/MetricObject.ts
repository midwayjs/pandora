/**
 * According to Opentsdb specification, only the following characters are allowed:
 * a to z, A to Z, 0 to 9, -, _, ., / or Unicode letters (as per the specification)
 */

import {MetricLevel} from 'metrics-common';

const ILLEGAL_CHARS = /[^a-zA-Z0-9-_./\\p{L}]/g;

/**
 * When output to metrics.log, all the illegal chars will be replaced by '_'
 * @param input the input string
 * @return a string with all the illegal chars replaced by '_'
 */
function removeIllegalOpentsdbChars(input) {
  if(!input) {
    return '';
  }
  return input.replace(ILLEGAL_CHARS, '_');
}

export enum CollectMetricType {
  /**
   * 用于累加型的数据
   */
  COUNTER = 'COUNTER',
    /**
     * 用于瞬态数据
     */
  GAUGE = 'GAUGE',
    /**
     * 用于整分整秒的计数
     */
  DELTA = 'DELTA',
}

export class Builder {

  private metric: MetricObject;

  constructor(name) {
    this.metric = new MetricObject();
    this.metric.metric = name;
  }

  build(): MetricObject {
    return this.metric;
  }

  withValue(value): Builder {
    this.metric.value = value;
    return this;
  }

  withTimestamp(timestamp: number): Builder {
    this.metric.timestamp = timestamp;
    return this;
  }

  withTags(tags): Builder {
    if (tags) {
      for (let key in tags) {
        this.metric.tags[key] = removeIllegalOpentsdbChars(tags[key]);
      }
    }
    return this;
  }

  withType(type: CollectMetricType): Builder {
    this.metric.metricType = type;
    return this;
  }

  withLevel(level: MetricLevel): Builder {
    this.metric.metricLevel = level;
    return this;
  }

  withInterval(interval: number): Builder {
    this.metric.interval = interval;
    return this;
  }

}


export class MetricObject {

  static MetricType = CollectMetricType;

  /*
   * {
   *   'metric': 'sys.cpu.nice',
   *   'timestamp': 1346846400,
   *   'value': 18,
   *   'type': 'COUNTER',
   *   'level': 'CRITICAL',
   *   'tags':
   *          { 'host': 'web01', 'dc': 'lga' }
   * }
   */

  static named(name: string): Builder {
    return new Builder(name);
  }

  metric: string;

  timestamp: number;  // seconds

  value: any;

  metricType: CollectMetricType;

  tags = {};

  metricLevel: MetricLevel;

  /**
   * 分桶统计时间间隔，目前针对Meter/BaseTimer/Compass有效，-1表示此项无效
   */
  interval = -1;

  getMetric() {
    return this.metric;
  }

  toString() {
    return 'MetricObject ->metric: ' + this.metric + ',value: '
      + this.value + ',timestamp: ' + this.timestamp + ',type: ' + this.metricType
      + ',tags: ' + this.tags + ',level: ' + this.metricLevel;
  }

  toJSON() {
    return {
      metric: this.metric,
      timestamp: this.timestamp,
      value: this.value,
      type: this.metricType,
      level: this.metricLevel,
      tags: this.tags,
      interval: this.interval,
    };
  }

}
