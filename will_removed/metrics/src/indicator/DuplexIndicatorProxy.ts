import {IndicatorProxy} from './IndicatorProxy';

export class DuplexIndicatorProxy extends IndicatorProxy {

  buildUplink(processReporter) {
    // 双工的话就处理接受的数据
    this.client.on(this.getClientUplinkKey(), processReporter);
  }

}
