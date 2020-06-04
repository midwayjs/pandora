'use strict';
const pkg = require('../index');

exports[pkg.pluginName] = {
  enable: true,
  components: {
    fileLoggerService: {
      path: require.resolve('@pandorajs/component-file-logger-service'),
    },
    fileReporter: {
      path: require.resolve('@pandorajs/component-file-reporter'),
    },
    logger: {
      path: require.resolve('@pandorajs/component-logger'),
    },
    metric: {
      path: require.resolve('@pandorajs/component-metric'),
    },
    metricInstrument: {
      path: require.resolve('@pandorajs/component-metric-instrument'),
    },
    trace: {
      path: require.resolve('@pandorajs/component-trace'),
    },
  },
  trace: {
    plugins: {
      http: {
        enabled: true,
        path: require.resolve('@opentelemetry/plugin-http'),
      },
      https: {
        enabled: true,
        path: require.resolve('@opentelemetry/plugin-https'),
      },
    },
  },
};
