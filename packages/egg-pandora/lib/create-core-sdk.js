'use strict';
const { CoreSDK } = require('pandora-core-sdk');

module.exports = (app, mode) => {

  const appName = app.name;
  const appDir = app.appDir || app.baseDir;
  const extendPandoraConfig = app.config.pandora;
  let optExtendConfig;
  /* istanbul ignore else */
  if (extendPandoraConfig) {
    optExtendConfig = [
      { config: extendPandoraConfig,
        configDir: appDir },
    ];
  }
  const extendContext = {
    egg: app,
  };
  const opts = {
    mode,
    appName, appDir,
    extendConfig: optExtendConfig,
    extendContext,
  };
  const sdk = new CoreSDK(opts);
  sdk.instantiate();
  return sdk;

};

