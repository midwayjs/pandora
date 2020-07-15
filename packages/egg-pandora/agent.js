'use strict';
const createCoreSdk = require('./lib/create-core-sdk');
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
    agent.pandora.eggAgentInstrument(agent);
  });
  agent.beforeClose(async () => {
    try {
      await coreSdk.stop();
    } catch (err) {
      // ignore
    }
  });
};
