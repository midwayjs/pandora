/**
 * monitor 默认配置
 */

import {MetricsEndPoint} from '../endpoint/impl/MetricsEndPoint';
import {MetricsResource} from '../rest/MetricsResource';
import {InfoEndPoint} from '../endpoint/impl/InfoEndPoint';
import {HealthResource} from '../rest/HealthResource';
import {DaemonEndPoint} from '../endpoint/impl/DaemonEndPoint';
import {DaemonResource} from '../rest/DaemonResource';
import {HealthEndPoint} from '../endpoint/impl/CommonEndPoint';

export default {
  http: {
    enabled: true,
    port: 7002,
  },
  endPoint: {
    daemon: {
      enabled: true,
      target: DaemonEndPoint,
      resource: DaemonResource,
    },
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
