'use strict';
const createCoreSdk = require('./lib/create-core-sdk');

module.exports = agent => {
  const config = agent.config.pandora;
  if (!config.enable) {
    return;
  }
  const PANDORA_HOME = process.env.PANDORA_HOME;
  if (PANDORA_HOME) {
    agent.coreLogger.warn('===== Pandora.js Warning =====');
    agent.coreLogger.warn('Pandora.js Warning: DO NOT use pandora and egg-pandora at same time ! egg-pandora will be skipped!');
    return;
  }
  const coreSdk = createCoreSdk(agent, 'supervisor');
  agent.pandoraCoreSdk = coreSdk;
  agent.pandora = coreSdk.coreContext;
  agent.beforeStart(async () => {
    await coreSdk.start();
  });
  agent.beforeClose(async () => {
    try {
      await coreSdk.stop();
    } catch (err) {
      // ignore
    }
  });
};
