import { IMetricsRegistry, Metric, MetricName, MetricSet, MetricsRegistry, MetricType } from './common';
import { ProxyCreateMessage, ProxyUpdateMessage } from './domain';
import { MetricsConstants } from './MetricsConstants';
import { Environment, EnvironmentUtil } from 'pandora-env';
import { MetricsMessengerClient } from './util/MessengerUtil';
import { Counter, FastCompass, Gauge, Histogram, Meter, Proxiable, Timer } from './client';
import { AbstractIndicator } from './indicator/AbstractIndicator';

export class MetricsClient extends AbstractIndicator {

  environment: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();

  static getInstance() {
    if (!this.instance) {
      this.instance = new MetricsClient();
    }

    return this.instance;
  }

  appName: string = this.getAppName();

  allMetricsRegistry: IMetricsRegistry = this.getNewMetricRegistry();

  protected messengerClient: MetricsMessengerClient = new MetricsMessengerClient(MetricsConstants.METRICS_PANDORA_KEY);

  clientId: string = Math.random().toString(35).substr(2, 10);

  group = 'metrics';

  debug = require('debug')('pandora:metrics:client:' + this.clientId);

  static instance: MetricsClient;

  constructor() {
    super();
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
  register(group: string, name: MetricName | string, metric: Proxiable | Metric | string) {
    this.debug(`Register: wait register a metrics name = ${name}`);
    let newName = this.buildName(name);
    // 把应用名加上
    newName = newName.tagged('appName', this.getAppName());

    if(typeof metric === 'string') {
      let newMetric = this.allMetricsRegistry.getMetric(newName);
      if(newMetric) {
        // 去重，并返回原指标
        return newMetric;
      } else {
        metric = this.createMetricProxy(metric);
      }
    }

    if (!metric.type) {
      metric.type = MetricType.GAUGE;
    }

    this.allMetricsRegistry.register(newName, <Metric> <any> metric);

    // Gauge 比较特殊，是实际的类，而服务端才是一个代理，和其他 metric 都不同，不需要 proxy
    if ((<Proxiable>metric).proxyMethod && (<Proxiable>metric).proxyMethod.length) {
      for (let method of (<Proxiable>metric).proxyMethod) {
        metric[ method ] = (...args) => {
          this.debug(`Invoke: invoke name = ${newName.getNameKey()}, type = ${metric.type}, method = ${method}, value = ${args}`);
          this.report({
            action: MetricsConstants.EVT_METRIC_UPDATE,
            name: newName.getNameKey(),
            method: method,
            value: args,
            type: metric.type,
            clientId: this.clientId
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

    return metric;
  }

  reportMetric(name: MetricName, metric: Metric, group: string) {
    this.report({
      action: MetricsConstants.EVT_METRIC_CREATE,
      name: name.getNameKey(),
      type: metric.type,
      group: group,
      clientId: this.clientId
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
    this.debug(`Invoke: invoked, key = ${args.metricKey} `);
    let metric = this.allMetricsRegistry.getMetric(MetricName.parseKey(args.metricKey));
    if (metric && metric.type === args.type) {
      return await Promise.resolve((<Gauge<any>>metric).getValue());
    } else {
      this.debug(`Invoke: can not find metric(${args.metricKey}) or type different`);
    }
  }

  /**
   * 注册下行链路
   */
  protected registerDownlink() {
    this.debug(`Register: down link eventKey = ${this.getClientDownlinkKey()}`);
    this.messengerClient.query(this.getClientDownlinkKey(), async (message, reply) => {
      try {
        reply && reply(await this.invoke(message));
      } catch (err) {
        // error
        this.debug(`Error: err = ${err}`);
        reply && reply();
      }
    });
  }

  protected getAppName() {
    return this.environment.get('appName');
  }

  getCounter(group: string, name: MetricName | string) {
    return this.register(group, name, 'COUNTER');
  }

  getTimer(group: string, name: MetricName | string) {
    return this.register(group, name, 'TIMER');
  }

  getMeter(group: string, name: MetricName | string) {
    return this.register(group, name, 'METER');
  }

  getHistogram(group: string, name: MetricName | string) {
    return this.register(group, name, 'HISTOGRAM');
  }

  getFastCompass(group: string, name: MetricName | string) {
    return this.register(group, name, 'FASTCOMPASS');
  }

  private buildName(name: MetricName | string): MetricName {
    if (typeof name === 'string') {
      name = MetricName.build(<string>name);
    }

    return <MetricName>name;
  }

  getNewMetricRegistry(): IMetricsRegistry {
    return new MetricsRegistry();
  }

  private createMetricProxy(type: string) {
    switch (type) {
      case 'COUNTER':
        return new Counter();
      case 'METER':
        return new Meter();
      case 'TIMER':
        return new Timer();
      case 'HISTOGRAM':
        return new Histogram();
      case 'FASTCOMPASS':
        return new FastCompass();
    }
  }

}
