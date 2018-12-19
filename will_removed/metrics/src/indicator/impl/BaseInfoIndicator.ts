import {Indicator} from '../../indicator/Indicator';
import {IBuilder, IndicatorScope} from '../../domain';

export class BaseInfoIndicator extends Indicator {

  group: string = 'info';

  async invoke(data: any, builder: IBuilder) {
    builder.withDetail('application', {
      appName: this.getAppName(),
      appDir: this.environment.get('appDir'),
    }, IndicatorScope.APP);

  }
}
