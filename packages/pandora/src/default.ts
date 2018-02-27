import {ProcfileReconcilerAccessor} from './application/ProcfileReconcilerAccessor';
import {join} from 'path';
import {homedir} from 'os';
import {BaseMonitor} from './monitor/Monitor';

const {DefaultEnvironment} = require('pandora-env');
const {
  ErrorEndPoint,
  HealthEndPoint,
  InfoEndPoint,
  ProcessEndPoint,
  MetricsEndPoint,
  TraceEndPoint,
  DaemonEndPoint,
  ErrorResource,
  MetricsResource,
  HealthResource,
  TraceResource,
  InfoResource,
  ProcessResource,
  DaemonResource,
  FileMetricsManagerReporter,
  MetricsClient,
  MetricsServerManager,
  CompactMetricsCollector,
  NormalMetricsCollector,
} = require('pandora-metrics');
const {LoggerService} = require('pandora-service-logger');
const hooks = require('pandora-hook');

export default {

  environment: DefaultEnvironment,

  procfile (pandora: ProcfileReconcilerAccessor) {

    const globalConfig = require('./universal/GlobalConfigProcessor')
      .GlobalConfigProcessor.getInstance().getAllProperties();

    pandora.defaultServiceCategory('worker');

    pandora.environment(globalConfig.environment);

    pandora.process('agent')
      .scale(1)
      .env({agent: 'true'});

    pandora.process('worker')
      .scale(pandora.dev ? 1 : 'auto')
      .env({worker: 'true'});

    pandora.process('background')
      .scale(1)
      .env({background: 'true'});

    pandora.service('logger', LoggerService)
      .name('logger')
      .process('weak-all');

  },

  logger: {
    logsDir: join(homedir(), 'logs'),
    appLogger: {
      stdoutLevel: 'NONE',
      level: 'INFO'
    },
    serviceLogger: {
      stdoutLevel: 'NONE',
      level: 'INFO',
    },
    daemonLogger: {
      stdoutLevel: 'ERROR',
      level: 'INFO',
    },
    isolatedServiceLogger: false
  },

  metricsManager: MetricsServerManager,
  metricsClient: MetricsClient,
  monitor: BaseMonitor,

  actuator: {
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
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          cacheSize: 100
        }
      },
      health: {
        enabled: true,
        target: HealthEndPoint,
        resource: HealthResource,
        initConfig: {
          port: {
            enabled: true,
            checkUrl: `http://127.1:6001`
          },
          disk_space: {
            enabled: true,
            rate: 80,
          }
        }
      },
      info: {
        enabled: true,
        target: InfoEndPoint,
        resource: InfoResource,
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
        resource: ProcessResource,
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource,
        initConfig: {
          collector: NormalMetricsCollector
        }
      },
      trace: {
        enabled: true,
        target: TraceEndPoint,
        resource: TraceResource,
        initConfig: {
          cacheSize: 1000,
          rate: process.env.NODE_ENV === 'production' ? 100 : 10,
          priority: true // 优先级高的链路是否跳出采样率限制
        }
      }
    },
  },

  hook: {
    global: {
      enabled: true,
      target: hooks.GlobalPatcher
    },
    eggLogger: {
      enabled: true,
      target: hooks.EggLoggerPatcher,
    },
    bluebird: {
      enabled: true,
      target: hooks.BluebirdPatcher
    },
    httpServer: {
      enabled: true,
      target: hooks.HttpServerPatcher,
      initConfig: {
        slowThreshold: 10 * 1000 // 慢链路标准，duration 大于等于 10s
      }
    },
    httpClient: {
      enabled: true,
      target: hooks.HttpClientPatcher
    },
    mysql: {
      enabled: true,
      target: hooks.MySQLPatcher
    },
    mysql2: {
      enabled: true,
      target: hooks.MySQL2Patcher
    },
    redis: {
      enabled: true,
      target: hooks.RedisPatcher
    }
  },
  reporterInterval: 15,
  reporter: {
    file: {
      enabled: true,
      target: FileMetricsManagerReporter,
      initConfig: {
        collector: CompactMetricsCollector
      }
    }
  }
};
