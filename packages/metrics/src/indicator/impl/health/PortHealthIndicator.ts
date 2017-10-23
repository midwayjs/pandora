import {HealthIndicator} from './HealthIndicator';
import * as cp from 'child_process';
import {HealthBuilder} from './HealthBuilder';

export class PortHealthIndicator extends HealthIndicator {

  name = 'port';

  async doCheck(builder: HealthBuilder, initConfig = {checkUrl: 'http://127.1:6001'}) {

    let checkUrl = initConfig['checkUrl'];

    try {
      let result = cp.execSync(`curl -s --connect-timeout 1 -o /dev/null -w "%{http_code}" ${checkUrl}`);
      if (result.toString() === '200') {
        builder.up();
      } else {
        builder.down();
      }
    } catch (err) {
      //TODO logger
      builder.down();
    }

  }

}
