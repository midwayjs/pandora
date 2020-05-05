'use strict';
const createCoreSdk = require('./lib/create-core-sdk');

module.exports = app => {
  const config = app.config.pandora;
  if (!config.enable) {
    return;
  }
  const PANDORA_HOME = process.env.PANDORA_HOME;
  if (PANDORA_HOME) {
    app.coreLogger.warn('===== Pandora.js Warning =====');
    app.coreLogger.warn('Pandora.js Warning: DO NOT use pandora and egg-pandora at same time ! egg-pandora will be skipped!');
    return;
  }
  const coreSdk = createCoreSdk(app, 'worker');
  app.pandoraCoreSdk = coreSdk;
  app.pandora = coreSdk.coreContext;

  app.config.coreMiddleware.unshift('metrics');

  app.beforeStart(async () => {
    await coreSdk.start();
  });
  app.beforeClose(async () => {
    try {
      await coreSdk.stop();
    } catch (err) {
      // ignore
    }
  });
};
