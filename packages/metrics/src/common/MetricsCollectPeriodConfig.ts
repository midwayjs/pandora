import {MetricLevel} from './MetricLevel';

export class MetricsCollectPeriodConfig {

  levelPeriodMap: Map<string, number> = new Map();

  globalPeriod: number = 60;

  private static instance;

  static getInstance() {
    if (!this.instance) {
      this.instance = new MetricsCollectPeriodConfig();
    }
    return this.instance;
  }

  constructor() {
    this.fillLevelPeriodMap();
  }

  /**
   * 预先填充map
   */
  private fillLevelPeriodMap() {
    this.levelPeriodMap.set(MetricLevel.CRITICAL, 1);
    this.levelPeriodMap.set(MetricLevel.MAJOR, 5);
    this.levelPeriodMap.set(MetricLevel.NORMAL, 15);
    this.levelPeriodMap.set(MetricLevel.MINOR, 30);
    this.levelPeriodMap.set(MetricLevel.TRIVIAL, 60);
  }

  period(level: MetricLevel) {
    let value = this.levelPeriodMap.get(MetricLevel[level]);
    // 这里采集周期和分桶的间隔保持一致
    return Math.min(value, this.globalPeriod);
  }

  /**
   * 修改全局的的时间间隔配置，但不会影响到已存在的level的配置
   *
   * @param globalPeriodSeconds
   * @return
   */
  configGlobalPeriod(globalPeriodSeconds) {
    if (globalPeriodSeconds < 0) {
      globalPeriodSeconds = 60;
    }

    this.globalPeriod = globalPeriodSeconds;
    return this;
  }

  getCachedTimeForLevel(level: MetricLevel) {

    switch (level) {
      case MetricLevel.TRIVIAL:
        return 50;
      case MetricLevel.MINOR:
        return 20;
      case MetricLevel.NORMAL:
        return 10;
      case MetricLevel.MAJOR:
        return 2;
      case MetricLevel.CRITICAL:
        return 1;
      default:
        return 50;
    }
  }

}
