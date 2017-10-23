import {EndPoint} from './EndPoint';
import {DuplexIndicatorProxy} from '../indicator/DuplexIndicatorProxy';

export abstract class DuplexEndPoint extends EndPoint {

  /**
   * 登记指标
   * @param data
   * @param reply
   * @param client
   */
  protected registerIndicator(data, reply, client) {
    if(this.group !== data.group) {
      // 不匹配则忽略
      return;
    }

    let indicatorProxy = new DuplexIndicatorProxy(client);
    // 构建指标
    indicatorProxy.buildIndicator(data);
    // 构建上行通路
    indicatorProxy.buildUplink(this.processReporter.bind(this));
    // 连接断开后需要清理
    indicatorProxy.bindRemove(this.removeClient.bind(this));
    this.indicators.push(indicatorProxy);
  }

  abstract processReporter(data, reply?);
}
