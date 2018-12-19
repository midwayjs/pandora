import {BaseEnvironment} from 'pandora-env';
import {MetricsConstants} from '../src/MetricsConstants';
const os = require('os');

export class MockEnvironment extends BaseEnvironment {

  constructor() {
    super({
      appName: MetricsConstants.METRICS_DEFAULT_APP,
      appDir: __dirname,
      pandoraLogsDir: os.tmpdir()
    });
  }

  match(name) {
    return name === 'test';
  }

}
