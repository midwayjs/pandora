import {Metric, MetricName, MetricsRegistry, MetricType} from './common/index';
import {ProxyCreateMessage, ProxyUpdateMessage} from './domain';
import {MetricsConstants} from './MetricsConstants';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {MetricsMessengerClient} from './util/MessengerUtil';
import {Proxiable, Gauge, Counter, Histogram, Meter, Timer} from './client/index';
import {AbstractIndicator} from './indicator/AbstractIndicator';
import {MetricSet} from './common/MetricSet';
const debug = require('debug')('pandora:metrics:client');

export class MetricsClient extends AbstractIndicator {

  environment: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();

  static getInstance() {
    if (!this.instance) {
      this.instance = new MetricsClient();
    }

    return this.instance;
  }

  appName: string = this.getAppName();

  allMetricsRegisty: MetricsRegistry = new MetricsRegistry();

  categoryMetrisMap: Map<string, MetricsRegistry> = new Map();

  protected messengerClient: MetricsMessengerClient = new MetricsMessengerClient(MetricsConstants.METRICS_PANDORA_KEY);

  clientId: string = Math.random().toString(35).substr(2, 10);

  group = 'metrics';

  static instance: MetricsClient;

  constructor() {
    super();
    debug(`start register client(${this.clientId})`);
    this.registerClient();
    this.registerDownlink();
  }

  /**
   * 注册 Client
   */
  protected registerClient() {
    this.messengerClient.register({
      appName: this.appName,
      clientId: this.clientId,
    });
  }

  /**
   * 注册一个 Metric
   *
   * @example
   * let counter = new BaseCounter();
   * MetricsClient.register('eagleeye', 'eagleeye.hsf.qps', counter);
   * counter.inc(2);
   *
   * @param {string} group
   * @param {} name
   * @param {Proxiable} metric
   */
  register(group: string, name: MetricName | string, metric: Proxiable | Metric ) {
    let newName = this.buildName(name);
    // 把应用名加上
    newName = newName.tagged('appName', this.getAppName());

    if(!metric.type) {
      metric.type = MetricType.GAUGE;
    }

    // 这边暂时不做去重
    this.allMetricsRegisty.register(newName, <Metric> <any> metric);

    // Gauge 比较特殊，是实际的类，而服务端才是一个代理，和其他 metric 都不同，不需要 proxy
    if ((<Proxiable>metric).proxyMethod && (<Proxiable>metric).proxyMethod.length) {
      for (let method of (<Proxiable>metric).proxyMethod) {
        metric[method] = (data) => {
          debug(`${this.clientId} invoke name = ${newName.getNameKey()}, type = ${metric.type}, method = ${method}, value = ${data}`);
          this.report({
            action: MetricsConstants.EVT_METRIC_UPDATE,
            name: newName.getNameKey(),
            method: method,
            value: data,
            type: metric.type,
          });
        };
      }
    }


    if (metric instanceof MetricSet) {
      // report metricSet
      // TODO 暂时忽略 metricSet 套 metricSet 的情况
      for (let subMetric of metric.getMetrics()) {
        this.reportMetric(MetricName.join(newName, subMetric.name), subMetric.metric, group);
      }
    } else {
      this.reportMetric(newName, metric, group);
    }

    this.report({
      action: MetricsConstants.EVT_METRIC_CREATE,
      name: newName.getNameKey(),
      type: metric.type,
      group: group,
    });

    let metricMap = this.categoryMetrisMap.get(group);
    if (!this.categoryMetrisMap.has(group)) {
      metricMap = new MetricsRegistry();
      this.categoryMetrisMap.set(group, metricMap);
    }

    metricMap.register(newName, <Metric> <any> metric);
  }

  reportMetric(name: MetricName, metric: Metric, group: string) {
    this.report({
      action: MetricsConstants.EVT_METRIC_CREATE,
      name: name.getNameKey(),
      type: metric.type,
      group: group,
    });
  }

  /**
   * 发送上行消息
   * @param data
   */
  report(data: ProxyCreateMessage | ProxyUpdateMessage) {
    this.messengerClient.report(this.getClientUplinkKey(), data);
  }

  async invoke(args: {
    metricKey,
    type,
  }) {
    debug(`Invoke: MetricsClient(${this.clientId}) invoked, key = ${args.metricKey} `);
    let metric = this.allMetricsRegisty.getMetric(MetricName.parseKey(args.metricKey));
    if(metric && metric.type === args.type) {
      return await Promise.resolve((<Gauge<any>>metric).getValue());
    }
  }

  /**
   * 注册下行链路
   */
  protected registerDownlink() {
    debug(`Listen: MetricsClient(${this.clientId}), eventKey = ${this.getClientDownlinkKey()}`);
    this.messengerClient.query(this.getClientDownlinkKey(), async(message, reply) => {
      try {
        reply && reply(await this.invoke(message));
      } catch (err) {
        // error
        debug(`Error: err = ${err}`);
        reply && reply();
      }
    });
  }

  protected getAppName() {
    return this.environment.get('appName');
  }

  getCounter(group: string, name: MetricName | string) {
    const counter = new Counter();
    this.register(group, name, counter);
    return counter;
  }

  getTimer(group: string, name: MetricName | string) {
    const timer = new Timer();
    this.register(group, name, timer);
    return timer;
  }

  getMeter(group: string, name: MetricName | string) {
    const meter = new Meter();
    this.register(group, name, meter);
    return meter;
  }

  getHistogram(group: string, name: MetricName | string) {
    const histogram = new Histogram();
    this.register(group, name, histogram);
    return histogram;
  }

  private buildName(name: MetricName | string): MetricName {
    if(typeof name === 'string') {
      name = MetricName.build(<string>name);
    }

    return <MetricName>name;
  }

}
