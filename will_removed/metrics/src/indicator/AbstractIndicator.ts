/**
 * 通用的指标抽象
 *
 */

import {IIndicator, IBuilder, IndicatorType} from '../domain';
import {MetricsConstants} from '../MetricsConstants';

export abstract class AbstractIndicator implements IIndicator {

  appName: string;

  group: string;

  clientId: string;

  /**
   * type of Indicator, default is singleton
   * @type {string}
   */
  type: IndicatorType = 'singleton';

  transferType = 'normal';

  abstract async invoke(data?: any, builder?: IBuilder);

  /**
   * create a client key for downlink
   * 生成一个唯一的客户端 key，每个进程唯一编号，用于下行链路调用
   * @returns {string}
   */
  protected getClientDownlinkKey(appName?, clientId?) {
    return [MetricsConstants.MESSENGER_DOWNLINK_KEY, appName || this.appName, this.group, clientId || this.clientId]
      .join(MetricsConstants.MESSENGER_SPLIT);
  }

  /**
   * create a client key for uplink
   * 生成一个用于上行链路的 key
   * @returns {string}
   */
  protected getClientUplinkKey(appName?, clientId?) {
    return [MetricsConstants.MESSENGER_UPLINK_KEY, appName || this.appName, this.group, clientId || this.clientId]
      .join(MetricsConstants.MESSENGER_SPLIT);
  }

  /**
   * return isSingleton
   * @returns {boolean}
   */
  protected isSingleton() {
    return this.type === 'singleton';
  }

  destory() {
  }
}
