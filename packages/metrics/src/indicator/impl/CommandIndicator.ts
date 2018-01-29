import {Indicator} from '../../indicator/Indicator';
import {IBuilder, IndicatorScope} from '../../domain';

export class CommandIndicator extends Indicator {

  group: string = 'command';

  async invoke(data: any, builder: IBuilder) {
    builder.withDetail('a.b.c.d', {
      appName: this.getAppName(),
      appDir: this.environment.get('appDir'),
    }, IndicatorScope.APP);
  }

}
