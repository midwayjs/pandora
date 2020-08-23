/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1588141217766_1902';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    pandora: {
      components: {
        reporterArms: {
          path: require.resolve('@pandorajs/component-reporter-arms'),
        },
      },
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
