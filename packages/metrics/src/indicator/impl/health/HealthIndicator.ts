import {HealthBuilder} from './HealthBuilder';
import {Indicator} from '../../Indicator';
import {IBuilder, IndicatorBuilderResult} from "../../../domain";

export abstract class HealthIndicator extends Indicator {

  group: string = 'health';

  async invoke(data: any, builder: HealthBuilder): Promise<Array<IndicatorBuilderResult>> {
    await this.doCheck(builder, this.config[this.name]);
    return builder.getDetails();
  }

  abstract async doCheck(builder: IBuilder, initConfig?);

  getBuilder(): IBuilder {
    return new HealthBuilder(this.name);
  }

}
