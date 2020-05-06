'use strict';

exports.pandora = {
  enable: true,
  components: {
    metrics: {
      path: require.resolve('pandora-component-metrics'),
    },
    nodeMetrics: {
      path: require.resolve('pandora-component-node-metrics'),
    },
    fileLoggerService: {
      path: require.resolve('pandora-component-file-logger-service')
    },
    sandboxFileReporter: {
      path: require.resolve('pandora-component-sandbox-file-reporter')
    },
    trace: {
      path: require.resolve('pandora-component-trace')
    }
  },
  trace: {
    plugins: {
      http: { enabled: true, path: '@opentelemetry/plugin-http' },
      https: { enabled: true, path: '@opentelemetry/plugin-https' },
    },
  },
};
