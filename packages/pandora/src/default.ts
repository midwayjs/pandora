import {DefaultConfigurator} from './universal/DefaultConfigurator';

const {DefaultEnvironment} = require("pandora-env");
const {
  ErrorEndPoint,
  HealthEndPoint,
  InfoEndPoint,
  ProcessEndPoint,
  RuntimeEndPoint,
  MetricsEndPoint,
  ErrorResource,
  MetricsResource,
  HealthResource,
  FileMetricManagerReporter,
  MetricsActuatorServer
} = require('pandora-metrics');
const {LoggerService} = require('pandora-service-logger');
const hooks = require('pandora-hook');

export default {
  process: {
    defaultCategory: 'worker',
    category: {
      agent: {
        order: 0,
        scale: 1,
        argv: [],
        env: {
          agent: 'true'
        }
      },
      worker: {
        order: 1,
        argv: [],
        scale: 'auto',
        env: {}
      },
      background: {
        order: 2,
        scale: 1,
        argv: [],
        env: {
          background: 'true'
        }
      }
    }
  },
  environment: DefaultEnvironment,
  configurator: DefaultConfigurator,
  service: {
    defaultCategory: 'all',
    injection: {
      'logger': {
        entry: LoggerService,
        config: (ctx) => {
          return ctx.config.loggerService;
        }
      }
    }
  },
  actuatorServer: MetricsActuatorServer,
  actuator: {
    http: {
      enabled: true,
      port: 8006,
    },

    endPoints: {
      error: {
        enabled: true,
        target: ErrorEndPoint,
        resource: ErrorResource,
        initConfig: {
          maxErrorCount: 100
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
      },
      process: {
        enabled: true,
        target: ProcessEndPoint,
      },
      runtime: {
        enabled: true,
        target: RuntimeEndPoint
      },
      metrics: {
        enabled: true,
        target: MetricsEndPoint,
        resource: MetricsResource
      }
    },
  },
  hooks: {
    eggLogger: hooks.eggLogger,
    urllib: hooks.urllib,
  },
  reporter: {
    file: {
      enabled: true,
      target: FileMetricManagerReporter,
      interval: 5
    }
  }
};
