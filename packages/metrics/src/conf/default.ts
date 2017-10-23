/**
 * monitor 默认配置
 */

import {MetricsEndPoint} from '../endpoint/impl/MetricsEndPoint';
import {MetricsResource} from '../rest/MetricsResource';
import {InfoEndPoint} from '../endpoint/impl/InfoEndPoint';
import {HealthEndPoint} from '../endpoint/impl/HealthEndPoint';
import {HealthResource} from '../rest/HealthResource';

export default {
  http: {
    enabled: true,
    port: 8006,
  },
  endPoints: {
    info: {
      enabled: true,
      target: InfoEndPoint,
    },
    metrics: {
      enabled: true,
      target: MetricsEndPoint,
      resource: MetricsResource
    },
    health: {
      enabled: true,
      target: HealthEndPoint,
      resource: HealthResource
    }
  },
};
