'use strict';
const createCoreSdk = require('./lib/create-core-sdk');
const LogTransport = require('./lib/log-transport');
const pkg = require('./index');

module.exports = agent => {
  const config = agent.config[pkg.pluginName];
  if (!config.enable) {
    return;
  }
  const coreSdk = createCoreSdk(agent, 'supervisor');
  agent.pandoraCoreSdk = coreSdk;
  agent.pandora = coreSdk.coreContext;
  agent.beforeStart(async () => {
    await coreSdk.start();
    for (const name of agent.loggers.keys()) {
      const logger = agent.loggers.get(name);
      let path;
      for (const transport of logger.values()) {
        path = transport.options.file;
        if (path) break;
      }

      logger.set(
        'pandora',
        new LogTransport({
          level: 'ALL',
          path,
          logProcessor: agent.pandora.logProcessor,
        })
      );
    }
  });
  agent.beforeClose(async () => {
    try {
      await coreSdk.stop();
    } catch (err) {
      // ignore
    }
  });
};
