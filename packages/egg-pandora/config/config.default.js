'use strict';

exports.pandora = {
  enable: true,
  components: {
    metrics: {
      path: require.resolve('@pandorajs/component-metrics'),
    },
    nodeMetrics: {
      path: require.resolve('@pandorajs/component-node-metrics'),
    },
    fileLoggerService: {
      path: require.resolve('@pandorajs/component-file-logger-service'),
    },
    fileReporter: {
      path: require.resolve('@pandorajs/component-file-reporter'),
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
