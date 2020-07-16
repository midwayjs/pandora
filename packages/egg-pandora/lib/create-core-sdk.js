'use strict';
const { Resource } = require('@opentelemetry/resources');
const { APPLICATION_RESOURCE } = require('@pandorajs/semantic-conventions');
const { CoreSDK } = require('@pandorajs/core-sdk');
const pkg = require('../index');

module.exports = (app, mode) => {
  const appName = app.name;
  const appDir = app.appDir || app.baseDir;
  const env = app.config.env;
  const extendPandoraConfig = app.config[pkg.pluginName];
  const resource = new Resource({
    [APPLICATION_RESOURCE.NAME]: appName,
    [APPLICATION_RESOURCE.ENV]: env,
    ...extendPandoraConfig.resource,
  });

  let optExtendConfig;
  /* istanbul ignore else */
  if (extendPandoraConfig) {
    optExtendConfig = [
      {
        config: {
          ...extendPandoraConfig,
          coreLogger: {
            ...(extendPandoraConfig.coreLogger || {}),
            dir: app.config.logger.dir,
          },
          reporterFile: {
            ...(extendPandoraConfig.reporterFile || {}),
            logsDir: app.config.logger.dir,
          },
        },
        configDir: appDir,
      },
    ];
  }
  const extendContext = {
    egg: app,
  };
  const opts = {
    mode,
    appName,
    appDir,
    resource,
    extendConfig: optExtendConfig,
    extendContext,
  };
  const sdk = new CoreSDK(opts);
  sdk.instantiate();
  return sdk;
};
