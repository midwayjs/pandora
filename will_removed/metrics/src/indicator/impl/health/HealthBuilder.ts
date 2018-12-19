import {IndicatorBuilder} from '../../IndicatorBuilder';
import {HealthIndicatorStatus} from '../../../domain';

export class HealthBuilder extends IndicatorBuilder {

  private indicatorName;

  constructor(indicatorName: string) {
    super();
    this.indicatorName = indicatorName;
  }

  up() {
    this.withDetail(this.indicatorName, HealthIndicatorStatus.UP);
    return this;
  }

  down() {
    this.withDetail(this.indicatorName, HealthIndicatorStatus.DOWN);
    return this;
  }

}
