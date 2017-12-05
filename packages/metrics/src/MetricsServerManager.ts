import {MessengerClient} from 'pandora-messenger';
import {MetricsMessengerServer} from './util/MessengerUtil';
import {MetricsConstants} from './MetricsConstants';
import {
  MetricsRegistry,
  Metric,
  MetricFilter,
  MetricsManager,
  MetricType,
  MetricName,
  BaseGauge,
  ICounter,
} from './common/index';
import {ProxyCreateMessage, ProxyUpdateMessage} from './domain';
import {AbstractIndicator} from './indicator/AbstractIndicator';
import {IMeter} from './common/metrics/Meter';
import {IHistogram} from './common/metrics/Histogram';
import {ITimer} from './common/metrics/Timer';
import {IMetricsRegistry} from './common/MetricsRegistry';
const util = require('util');
const debug = require('debug')('pandora:metrics:server');

export class MetricsServerManager extends AbstractIndicator implements MetricsManager {

  messengerServer: MetricsMessengerServer = new MetricsMessengerServer(MetricsConstants.METRICS_PANDORA_KEY);

  metricsClients: Map<string, MessengerClient> = new Map();

  allMetricsRegistry: IMetricsRegistry = this.getNewMetricRegistry();

  metricRegistryMap: Map<string, IMetricsRegistry> = new Map();

  clientId: string = Math.random().toString(35).substr(2, 10);

  logger = <any>console;

  enabled = true;

  group = 'metrics';

  static instance;

  static getInstance() {
    if(!this.instance) {
      this.instance = new MetricsServerManager();
    }
    return this.instance;
  }

  constructor() {
    super();
    debug(`server(${this.clientId}) start listen and wait client`);
    this.messengerServer.discovery(this.registerClient.bind(this));
  }

  /**
   * 注册客户端
   * @param data
   * @param reply
   * @param client
   */
  protected registerClient(data: {
    appName,
    clientId,
  }, reply, client) {
    if (!this.enabled) {
      return;
    }

    debug(`server(${this.clientId}) get client(${data.clientId}) and ready binding`);
    // 这里统一维护一个客户端列表
    client._APP_NAME = data.appName;
    client._CLIENT_ID = data.clientId;
    this.metricsClients.set(data.clientId, client);

    // 构建 report 通路
    this.buildReportLink(client);
    // 清理客户端
    this.bindRemove(client);

    debug(`server(${this.clientId}) now client number = ${this.metricsClients.size}`);
  }

  protected buildReportLink(client) {
    // 处理接受的数据
    client.on(this.getClientUplinkKey(client._APP_NAME, client._CLIENT_ID), (data) => {
      if(data.action === MetricsConstants.EVT_METRIC_CREATE) {
        this.registerMetric(data);
      } else if(data.action === MetricsConstants.EVT_METRIC_UPDATE) {
        this.updateMetric(data);
      }
    });
  }

  protected bindRemove(client) {
    client.on('close', () => {
      let remove_id = client._CLIENT_ID;
      let remove_client = this.metricsClients.get(remove_id);
      remove_client.close();
      this.metricsClients.delete(remove_id);
      debug(`server(${this.clientId}) remove client(${remove_id})`);
    });
  }

  /**
   * 注册一个 metric
   *
   * @param data
   */
  protected registerMetric(data: ProxyCreateMessage) {
    debug(`server(${this.clientId}) got "create" action, name = ${data.name}, type = ${data.type}, group = ${data.group}`);

    // 创建新指标
    let metric;
    let metricName = MetricName.parseKey(data.name);

    switch(data.type) {
      case 'GAUGE':
        metric = this.createGaugeProxy(metricName);
        break;
      case 'COUNTER':
        metric = this.allMetricsRegistry.counter(metricName);
        break;
      case 'METER':
        metric = this.allMetricsRegistry.meter(metricName);
        break;
      case 'TIMER':
        metric = this.allMetricsRegistry.timer(metricName);
        break;
      case 'HISTOGRAM':
        metric = this.allMetricsRegistry.histogram(metricName);
        break;
      default:
        metric = this.createGaugeProxy(metricName);
    }

    // 注册后加入分组
    let metricRegistry = this.getMetricRegistryByGroup(data.group);
    metricRegistry.register(metricName, metric);
    debug(`after register and manager register ${metricName}`);
    debug('---------------- current name registryMap ----------------');
    debug('current name registryMap = ');
    debug(this.metricRegistryMap);
    debug('current metricService allRegistryMap = ');
    debug(this.allMetricsRegistry);
    debug('-----------------------------------------------------------');
    debug(`server(${this.clientId}) metrics number = ${this.allMetricsRegistry.getKeys().length}`);
    return metric;
  }

  protected updateMetric(data: ProxyUpdateMessage) {
    debug(`server(${this.clientId}) got "update" action, name = ${data.name}, type = ${data.type}, method = ${data.method}, value = ${data.value}`);
    // 找指标
    let metricName = MetricName.parseKey(data.name);
    let metric = this.allMetricsRegistry.getMetric(metricName);
    if(metric) {
      debug(`server(${this.clientId}) find metric(${data.name}), type = ${metric.type}`);
      if(metric.type === data.type) {
        debug(`type equal and call ${data.method}(${data.value})`);
        // (metric[data.method]).call(this, data.value);
        metric[data.method](data.value);
      }
    } else {
      debug(`server(${this.clientId}) can't find msetric(${data.name})`);
    }
  }

  /**
   * 创建一个 Gauge 类型的代理实例
   * @param metricName
   * @returns {any}
   */
  protected createGaugeProxy(metricName) {
    let self = this;
    let metric = <BaseGauge<any>> {
      async getValue() {
        debug('Invoke: invoke Gauge');
        let results = await self.invoke({
          metricKey: metricName.toString(),
          type: MetricType.GAUGE,
        });

        debug(`Invoke: invoke Gauge and getValue = ${util.inspect(results)}`);
        return results;
      }
    };
    self.allMetricsRegistry.register(metricName, metric);
    return metric;
  }

  /**
   * 对客户端的调用，现在用于 Gauge 类型的获取值
   * @param args
   * @returns {Promise<void>}
   */
  async invoke(args?: any) {
    for(let client of this.getClients()) {
      let result = await new Promise((resolve) => {
        debug(`Invoke: eventKey(${this.getClientDownlinkKey((<any>client)._APP_NAME, (<any>client)._CLIENT_ID)}), args = ${args}`);
        client.send(this.getClientDownlinkKey((<any>client)._APP_NAME, (<any>client)._CLIENT_ID), args, (err, result) => {
          debug(`Invoke: invoke end and err = ${err}, results = ${result}`);
          resolve(result);
        }, MetricsConstants.CLIENT_TIME_OUT);
      });

      if(result !== null && result !== undefined) {
        return result;
      }
    }
  }

  getClients(): Array<MessengerClient> {
    return Array.from(this.metricsClients.values());
  }

  getClient(clientId: string) {
    return this.metricsClients.get(clientId);
  }

  getMetric(name: MetricName): Metric {
    return this.allMetricsRegistry.getMetric(name);
  }

  getAllMetricsRegistry() {
    return this.allMetricsRegistry;
  }

  destroy() {
    this.enabled = false;
    for(let client of this.metricsClients.values()) {
      client.close();
    }
  }

  register(group: string, name: MetricName | string, metric: Metric) {
    if (!this.enabled) {
      return;
    }

    let newName;
    if(typeof name === 'string') {
      newName = MetricName.build(name);
    } else {
      newName = name;
    }

    // register to all first
    this.allMetricsRegistry.register(newName, metric);

    // register to name second
    const metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    metricRegistry.register(newName, metric);
  }

  getMetricRegistryByGroup(group: string): IMetricsRegistry {
    if (!this.metricRegistryMap.has(group)) {
      this.metricRegistryMap.set(group, this.getNewMetricRegistry());
    }
    return this.metricRegistryMap.get(group);
  }

  hasMetricRegistryByGroup(group: string): boolean {
    return this.metricRegistryMap.has(group);
  }

  getGauges(group: string, filter: MetricFilter = MetricFilter.ALL) {
    let metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    return metricRegistry.getGauges(filter);
  }

  getCounters(group: string, filter: MetricFilter = MetricFilter.ALL) {
    let metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    return metricRegistry.getCounters(filter);
  }

  getHistograms(group: string, filter: MetricFilter = MetricFilter.ALL) {
    let metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    return metricRegistry.getHistograms(filter);
  }

  getMeters(group: string, filter: MetricFilter = MetricFilter.ALL) {
    let metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    return metricRegistry.getMeters(filter);
  }

  getTimers(group: string, filter: MetricFilter = MetricFilter.ALL) {
    let metricRegistry: IMetricsRegistry = this.getMetricRegistryByGroup(group);
    return metricRegistry.getTimers(filter);
  }

  getMetrics(group: string): Map<string, Metric> {
    let metricRegistry: IMetricsRegistry = this.metricRegistryMap.get(group);
    if (metricRegistry) {
      return metricRegistry.getMetrics();
    }
    return new Map();
  }

  getCategoryMetrics(group: string, filter: MetricFilter = MetricFilter.ALL): Map<string, Map<string, Metric>> {
    const metricRegistry = this.metricRegistryMap.get(group);
    const result:  Map<string, Map<string, Metric>> = new Map();

    result.set(MetricType.GAUGE, metricRegistry.getGauges(filter));
    result.set(MetricType.COUNTER, metricRegistry.getCounters(filter));
    result.set(MetricType.HISTOGRAM, metricRegistry.getHistograms(filter));
    result.set(MetricType.METER, metricRegistry.getMeters(filter));
    result.set(MetricType.TIMER, metricRegistry.getTimers(filter));

    return result;
  }

  getAllCategoryMetrics(filter: MetricFilter = MetricFilter.ALL): Map<string, Map<string, Metric>> {
    const result:  Map<string, Map<string, Metric>> = new Map();
    const allMetricsRegistry = this.getAllMetricsRegistry();

    result.set(MetricType.GAUGE, allMetricsRegistry.getGauges(filter));
    result.set(MetricType.COUNTER, allMetricsRegistry.getCounters(filter));
    result.set(MetricType.HISTOGRAM, allMetricsRegistry.getHistograms(filter));
    result.set(MetricType.METER, allMetricsRegistry.getMeters(filter));
    result.set(MetricType.TIMER, allMetricsRegistry.getTimers(filter));

    return result;
  }

  listMetricGroups() {
    return Array.from(this.metricRegistryMap.keys());
  }

  isEnabled() {
    return !!this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  listMetricNamesByGroup() {
    if (!this.enabled) {
      return new Map();
    }

    let result = new Map();

    for (let [group, metricRegistry] of this.metricRegistryMap.entries()) {
      result.set(group, metricRegistry.getMetricNames());
    }
    return result;
  }

  getMeter(group: string, name: MetricName): IMeter {
    return this.getMetricRegistryByGroup(group).meter(name);
  }

  getCounter(group: string, name: MetricName): ICounter {
    return this.getMetricRegistryByGroup(group).counter(name);
  }

  getHistogram(group: string, name: MetricName): IHistogram {
    return this.getMetricRegistryByGroup(group).histogram(name);
  }

  getTimer(group: string, name: MetricName): ITimer {
    return this.getMetricRegistryByGroup(group).timer(name);
  }

  destory() {
    this.messengerServer.close();
    for (let client of this.metricsClients.values()) {
      client.close();
    }
    MetricsServerManager.instance = null;
  }

  getNewMetricRegistry(): IMetricsRegistry {
    return new MetricsRegistry();
  }

}
