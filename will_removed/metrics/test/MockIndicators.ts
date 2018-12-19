import {MockEnvironment} from './MockEnvironment';
import {EnvironmentUtil} from 'pandora-env';
import {PortHealthIndicator} from '../src/indicator/impl/health/PortHealthIndicator';
import {DiskSpaceHealthIndicator} from '../src/indicator/impl/health/DiskSpaceHealthIndicator';
import {ProcessIndicator} from '../src/indicator/impl/ProcessIndicator';

export class MockIndicators {

  init() {
    EnvironmentUtil.getInstance().setCurrentEnvironment(new MockEnvironment());

    let indicators = [
      new PortHealthIndicator(),
      new DiskSpaceHealthIndicator(),
      new ProcessIndicator()
    ];

    for(let indicator of indicators) {
      indicator.initialize();
    }
  }
}
