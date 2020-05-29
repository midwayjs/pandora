'use strict';
const createCoreSdk = require('./lib/create-core-sdk');
const LogTransport = require('./lib/log-transport');

module.exports = agent => {
  const config = agent.config.pandora;
  if (!config.enable) {
    return;
  }
  const PANDORA_HOME = process.env.PANDORA_HOME;
  if (PANDORA_HOME) {
    agent.coreLogger.warn('===== Pandora.js Warning =====');
    agent.coreLogger.warn(
      'Pandora.js Warning: DO NOT use pandora and egg-pandora at same time ! egg-pandora will be skipped!'
    );
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
