import {DefaultConfigurator} from './universal/DefaultConfigurator';
import {ProcfileReconcilerAccessor} from './application/ProcfileReconcilerAccessor';

const {DefaultEnvironment} = require('pandora-env');
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

  procfile (pandora: ProcfileReconcilerAccessor) {

    pandora.defaultAppletCategory('worker');
    pandora.defaultServiceCategory('weak-all');

    pandora.environment(DefaultEnvironment);
    pandora.configurator(DefaultConfigurator);

    pandora.process('agent')
      .scale(1)
      .env({agent: 'true'});

    pandora.process('worker')
      .scale('auto')
      .env({worker: 'true'});

    pandora.process('background')
      .scale(1)
      .env({background: 'true'});

    pandora.service(LoggerService)
      .name('logger')
      .process('weak-all')
      .config((ctx) => {
        return ctx.config.loggerService;
      });

  },

  actuatorServer: MetricsActuatorServer,

  actuator: {
    http: {
      enabled: true,
      port: 7002,
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
