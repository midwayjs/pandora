import {Metric, MetricName, MetricsRegistry, MetricType} from './common/index';
import {ProxyCreateMessage, ProxyUpdateMessage} from './domain';
import {MetricsConstants} from './MetricsConstants';
import {EnvironmentUtil, Environment} from 'pandora-env';
import {MetricsMessengerClient} from './util/MessengerUtil';
import {Proxiable, Gauge} from './client/index';
import {AbstractIndicator} from './indicator/AbstractIndicator';
const debug = require('debug')('pandora:metrics:client');

export class MetricsClient extends AbstractIndicator {

  environment: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();

  appName: string = this.getAppName();

  allMetricsRegisty: MetricsRegistry = new MetricsRegistry();

  categoryMetrisMap: Map<string, MetricsRegistry> = new Map();

  protected messengerClient: MetricsMessengerClient = new MetricsMessengerClient(MetricsConstants.METRICS_PANDORA_KEY);

  clientId: string = Math.random().toString(35).substr(2, 10);

  group = 'metrics';

  static instance: MetricsClient;

  static getInstance() {
    if (!this.instance) {
      this.instance = new MetricsClient();
    }

    return this.instance;
  }

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
  register(group: string, name: MetricName, metric: Proxiable | Metric ) {
    // 把应用名加上
    name = name.tagged('appName', this.getAppName());

    if(!metric.type) {
      metric.type = MetricType.GAUGE;
    }

    // 这边暂时不做去重
    this.allMetricsRegisty.register(name, <Metric> <any> metric);

    // Gauge 比较特殊，是实际的类，而服务端才是一个代理，和其他 metric 都不同，不需要 proxy
    if ((<Proxiable>metric).proxyMethod && (<Proxiable>metric).proxyMethod.length) {
      for (let method of (<Proxiable>metric).proxyMethod) {
        metric[method] = (data) => {
          debug(`${this.clientId} invoke name = ${name.getNameKey()}, type = ${metric.type}, method = ${method}, value = ${data}`);
          this.report({
            action: MetricsConstants.EVT_METRIC_UPDATE,
            name: name.getNameKey(),
            method: method,
            value: data,
            type: metric.type,
          });
        };
      }
    }

    this.report({
      action: MetricsConstants.EVT_METRIC_CREATE,
      name: name.getNameKey(),
      type: metric.type,
      group: group,
    });

    let metricMap = this.categoryMetrisMap.get(group);
    if (!this.categoryMetrisMap.has(group)) {
      metricMap = new MetricsRegistry();
      this.categoryMetrisMap.set(group, metricMap);
    }

    metricMap.register(name, <Metric> <any> metric);
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
    debug(`Invoke: MetricsClient(${this.clientId}) invoked `);
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

}
