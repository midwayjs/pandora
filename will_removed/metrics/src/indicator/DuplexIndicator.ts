/**
 * 实现一个双工的指标
 *
 */

import {Indicator} from './Indicator';
import {IBuilder} from '../domain';

export abstract class DuplexIndicator extends Indicator {

  transferType = 'duplex';

  initialize() {
    super.initialize();
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
