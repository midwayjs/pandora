import {MetricName} from './MetricName';
import {IMeter} from './metrics/Meter';
import {ICounter} from './metrics/Counter';
import {IHistogram} from './metrics/Histogram';
import {ITimer} from './metrics/Timer';
import {IMetricsRegistry} from './MetricsRegistry';
import {MetricFilter} from './MetricFilter';
import {BaseGauge} from './metrics/Gauge';
import {Metric} from './domain';
import { IFastCompass } from './metrics/FastCompass';

export interface MetricsManager {
  /**
   * Create a {@link BaseMeter} metric in given group, and name.
   * if not exist, an instance will be created.
   *
   * @param group the group of MetricRegistry
   * @param name the name of the metric
   * @return an instance of meter
   */
  getMeter(group: string, name: MetricName): IMeter;

  /**
   * Create a {@link ICounter} metric in given group, and name.
   * if not exist, an instance will be created.
   *
   * @param group the group of MetricRegistry
   * @param name the name of the metric
   * @return an instance of counter
   */
  getCounter(group: string, name: MetricName): ICounter;

  /**
   * Create a {@link BaseHistogram} metric in given group, and name.
   * if not exist, an instance will be created.
   *
   * @param group the group of MetricRegistry
   * @param name the name of the metric
   * @return an instance of histogram
   */
  getHistogram(group: string, name: MetricName): IHistogram;

  /**
   * Create a {@link BaseTimer} metric in given group, and name.
   * if not exist, an instance will be created.
   *
   * @param group the group of MetricRegistry
   * @param name the name of the metric
   * @return an instance of timer
   */
  getTimer(group: string, name: MetricName): ITimer;

  getFastCompasses(group: string, filter?: MetricFilter): Map<string, IFastCompass>;

  /**
   * Register a customized metric to specified group.
   * @param group: the group name of MetricRegistry
   * @param metric the metric to register
   */
  register(group: string, name: MetricName, metric: Metric);

  /**
   * Get a list of group in current MetricManager
   * @return a list of group name
   */
  listMetricGroups(): Array<string> ;

  /**
   * A global flag to complete disable the metrics feature
   * @return true if it is enabled.
   */
  isEnabled(): boolean;

  /**
   * A global flag to complete disable the metrics feature
   */
  setEnabled(enabled: boolean);

  /**
   * list all metric names by group
   * @return a map of metric name set, keyed by group name
   */
  listMetricNamesByGroup(): Map<string, Array<MetricName>>;

  /**
   * Get metric registry by group name,
   * if not found, null will be returned
   * @param group the group name to query
   * @return the MetricRegistry that is correspondent to the group
   */
  getMetricRegistryByGroup(group: string): IMetricsRegistry;

  getGauges(group: string, filter?: MetricFilter): Map<string, BaseGauge<any>>;

  getCounters(group: string, filter?: MetricFilter): Map<string, ICounter>;

  getHistograms(group: string, filter?: MetricFilter): Map<string, IHistogram>;

  getMeters(group: string, filter?: MetricFilter): Map<string, IMeter>;

  getTimers(group: string, filter?: MetricFilter): Map<string, ITimer>;

  /**
   * Create a {@link BaseFastCompass} metric in give group, name, and type
   * if not exist, an instance will be created.
   * @param group the group of MetricRegistry
   * @param name the name of the metric
   * @return an instance of {@link BaseFastCompass}
   */
  getFastCompass(group: string, name: MetricName): IFastCompass;

  /**
   * A map of metric names to metrics.
   *
   * @return the metrics
   */
  getMetrics(group: string): Map<string, Metric>;

  /**
   * 返回不同Metric分类，各自保存好的map
   *
   * @param group
   * @param filter
   * @return
   */
  getCategoryMetrics(group: string, filter?: MetricFilter): Map<string, Map<string, Metric>>;

  /**
   * return all metrics
   *
   * @param filter
   * @return
   */
  getAllCategoryMetrics(filter?: MetricFilter): Map<string, Map<string, Metric>>;

  getNewMetricRegistry(): IMetricsRegistry;
}
