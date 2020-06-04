'use strict';
const createCoreSdk = require('./lib/create-core-sdk');
const monitor = require('./lib/app-monitor');
const pkg = require('./index');

module.exports = app => {
  const config = app.config[pkg.pluginName];
  if (!config.enable) {
    return;
  }
  const coreSdk = createCoreSdk(app, 'worker');
  app.pandoraCoreSdk = coreSdk;
  app.pandora = coreSdk.coreContext;

  app.beforeStart(async () => {
    await coreSdk.start();
    monitor(app);
  });
  app.beforeClose(async () => {
    try {
      await coreSdk.stop();
    } catch (err) {
      // ignore
    }
  });
};
