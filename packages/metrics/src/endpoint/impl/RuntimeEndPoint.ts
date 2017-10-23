import {EndPoint} from '../EndPoint';
import {NodeIndicator} from '../../indicator/impl/NodeIndicator';

export class RuntimeEndPoint extends EndPoint {

  group: string = 'runtime';

  initialize() {
    super.initialize();

    // 直接加载系统指标
    [
      new NodeIndicator(),
    ].forEach((instance) => {
      instance.initialize();
    });
  }

}
