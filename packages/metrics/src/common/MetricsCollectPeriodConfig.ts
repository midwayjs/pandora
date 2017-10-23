import {MetricLevel} from './MetricLevel';
const globalPeriod = 60;

export class MetricsCollectPeriodConfig {

  levelPeriodMap: Map<string, number> = new Map();

  constructor() {
    this.fillLevelPeriodMap();
  }
  /**
   * 预先填充map
   */
  private fillLevelPeriodMap() {
    this.levelPeriodMap.set(MetricLevel[MetricLevel.CRITICAL], 1);
    this.levelPeriodMap.set(MetricLevel[MetricLevel.MAJOR], 5);
    this.levelPeriodMap.set(MetricLevel[MetricLevel.NORMAL], 15);
    this.levelPeriodMap.set(MetricLevel[MetricLevel.MINOR], 30);
    this.levelPeriodMap.set(MetricLevel[MetricLevel.TRIVIAL], 60);
  }

  period(level: MetricLevel) {
    let value = this.levelPeriodMap.get(MetricLevel[level]);
    return value != null ? value : globalPeriod;
  }
}
