/**
 * 实现一个双工的指标
 *
 */

const debug = require('debug')('pandora:metrics:DuplexIndicator');
const assert = require('assert');
import {Indicator} from './Indicator';
import {IBuilder} from '../domain';

export abstract class DuplexIndicator extends Indicator {

  type;

  initialize() {
    debug(`Register: indicator(${this.name}) start register`);

    assert(this.appName, 'Indicator appName property is required');
    assert(this.group, 'Indicator group property is required');

    debug(`Registering: indicator(${this.name}) send register, appName = ${this.appName}, group = ${this.group}, clientId = ${this.clientId}`);

    this.registerIndicator();
    debug(`Registering: indicator(${this.name}) register downlink`);
    this.registerDownlink();
    debug(`Registering: indicator(${this.name}) register uplink`);
    this.registerUplink();
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
      duplex: true,
    });
  }

  abstract registerUplink();

  /**
   * 下行链路调用
   * @param data
   * @param builder
   */
  abstract async invoke(data: any, builder: IBuilder);

  /**
   * 发送上行消息
   * @param data
   */
  report(data: any) {
    this.messengerClient.report(this.getClientUplinkKey(), data);
  }

}
