import {BaseEnvironment} from 'pandora-env';
import {MetricsConstants} from 'pandora-metrics';

export class MockEnvironment extends BaseEnvironment {

  constructor() {
    super({
      appName: MetricsConstants.METRICS_DEFAULT_APP
    });
  }

  match(name) {
    return name === 'test';
  }

}
