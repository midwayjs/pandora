/**
 * 磁盘可用率检查
 */

import {HealthIndicator} from './HealthIndicator';
import * as os from 'os';
import {HealthBuilder} from './HealthBuilder';
import * as df from 'node-df';

export class DiskSpaceHealthIndicator extends HealthIndicator {

  name = 'disk_space';

  async doCheck(builder: HealthBuilder, initConfig = {rate: 80}) {
    const checkRate = initConfig['rate'] || 80;
    if (os.type() !== 'Windows_NT') {
      await new Promise((resolve, reject) => {
        df(function (err, response) {
          if (err) {
            return reject(err);
          }
          if(response.length) {
            let res = response.filter((re) => {
              return re.mount === '/';
            });

            let capacity = 1;
            if(res.length) {
              capacity = res[0].capacity;
            }
            capacity = capacity * 100;
            if (capacity > checkRate) {
              builder.down();
            } else {
              builder.up();
            }
          }
          resolve();
        });
      }).catch((err) => {
        // logger
      });

    }
  }

}
