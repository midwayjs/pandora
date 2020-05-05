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
  },
};
