/**
 * 获取运行时的配置
 *
 */

import {Indicator} from '../Indicator';
import {IBuilder} from '../../domain';

export class ConfigIndicator extends Indicator {

  group: string = 'runtime';

  userConfigurator: any;

  constructor(userConfig) {
    super();
    this.userConfigurator = userConfig;
  }

  async invoke(data: any, builder: IBuilder) {
    builder.withDetail('config', await this.userConfigurator.getAllProperties());
  }

}
