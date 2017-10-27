'use strict';
import {makeRequire} from 'pandora-dollar';
import {PANDORA_CWD, PANDORA_GLOBAL_CONFIG} from '../const';
import {consoleLogger} from './LoggerBroker';
import extend = require('extend');
const GLOBAL_PACKAGE_SPLIT = ':';

export class GlobalConfigProcessor {

  globalConfig;

  static instance;

  static getInstance() {
    if (!this.instance) {
      this.instance = new GlobalConfigProcessor();
    }
    return this.instance;
  }

  getAllProperties() {
    const cwd = process.env[PANDORA_CWD] || process.cwd();
    const cwdRequire = makeRequire(cwd);
    if (!this.globalConfig) {
      const configPaths = process.env[PANDORA_GLOBAL_CONFIG] ? process.env[PANDORA_GLOBAL_CONFIG].split(GLOBAL_PACKAGE_SPLIT) : [];
      let globalConfig = require('../default').default;
      for (const configPath of configPaths) {
        if (configPath) {
          try {
            let extendConfig = cwdRequire(configPath);
            extendConfig = extendConfig.default ? extendConfig.default : extendConfig;
            globalConfig = extend(true, globalConfig, extendConfig);
          } catch (err) {
            // info
            consoleLogger.info(`Can't find config from ${configPath}`);
            consoleLogger.warn(err);
          }
        }
      }
      this.globalConfig = globalConfig;
    }

    return this.globalConfig;

  }
}
