/**
 * 每个 endpoint 可能分为多个小的 indicator
 */

import {MetricsMessengerClient} from '../util/MessengerUtil';
import {AbstractIndicator} from './AbstractIndicator';
import {IndicatorBuilder} from './IndicatorBuilder';
import {IBuilder} from '../domain';
import {EnvironmentUtil, Environment} from 'pandora-env';
const debug = require('debug')('pandora:metrics:Indicator');
const assert = require('assert');
const util = require('util');

export abstract class Indicator extends AbstractIndicator {

  environment: Environment = EnvironmentUtil.getInstance().getCurrentEnvironment();

  appName: string = this.getAppName();

  name: string = this.constructor.name;

  clientId: string = Math.random().toString(35).substr(2, 10);

  protected messengerClient: MetricsMessengerClient = new MetricsMessengerClient(this.group);

  config = {};

  initialize() {

    debug(`Register: indicator(${this.name}) start register`);

    assert(this.appName, 'Indicator appName property is required');
    assert(this.group, 'Indicator group property is required');

    debug(`Registering: indicator(${this.name}) send register, appName = ${this.appName}, group = ${this.group}, clientId = ${this.clientId}`);

    this.registerIndicator();
    this.registerDownlink();
  }

  /**
   * 注册指标到对应的 Endpoint
   */
  protected registerIndicator() {
    this.messengerClient.register({
      indicatorName: this.name,
      appName: this.appName,
      group: this.group,
      clientId: this.clientId,
      type: this.type,
    }, (err, config) => {
      if(err) {
        debug('Error: err = ' + err);
      } else {
        debug(`indicator(${this.name}) Accept config from EndPoint, config = ${util.inspect(config)}`);
        this.config = config;
      }
    });
  }

  /**
   * 注册下行链路
   */
  protected registerDownlink() {
    debug(`Listen: indicator(${this.name}), eventKey = ${this.getClientDownlinkKey()}`);
    this.messengerClient.query(this.getClientDownlinkKey(), async(message, reply) => {
      debug(`Invoke: indicator(${this.name}), message = ${message}`);
      // 如果没有配置，但是又实例化了，默认就是 true
      if(!this.config[this.group] || this.config[this.group].enabled !== false) {
        let builder = this.getBuilder();
        try {
          await this.invoke(message, builder);
          debug(`Return: indicator(${this.name}) invoke complete`);
          reply && reply(builder.getDetails());
        } catch (err) {
          // error
          debug(`Error: err = ${err}`);
          reply && reply();
        }
      } else {
        // 未启用就不执行
        debug(`Return: indicator(${this.name}) enabled = false and call end`);
      }
    });
  }

  abstract async invoke(data: any, builder: IBuilder);

  getBuilder(): IBuilder {
    return new IndicatorBuilder();
  }

  protected getAppName() {
    return this.environment.get('appName');
  }

  destory() {
    this.messengerClient.close();
  }

}
