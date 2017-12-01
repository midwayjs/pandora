'use strict';
import {makeRequire} from 'pandora-dollar';
import {PANDORA_CWD, PANDORA_GLOBAL_CONFIG} from '../const';
import {consoleLogger} from './LoggerBroker';
import extend = require('extend');

export class GlobalConfigProcessor {

  private globalConfig = {};

  static instance;

  private initialized = false;

  static GLOBAL_PACKAGE_SPLIT = ':';

  public loadedConfigPath: string[] = [require.resolve('../default')];

  static getInstance(): GlobalConfigProcessor {
    if (!this.instance) {
      this.instance = new GlobalConfigProcessor();
    }
    return this.instance;
  }

  getAllProperties(): any {
    if (!this.initialized) {
      const cwd = process.env[PANDORA_CWD] || process.cwd();
      const cwdRequire = makeRequire(cwd);
      const configPaths = process.env[PANDORA_GLOBAL_CONFIG] ? process.env[PANDORA_GLOBAL_CONFIG].split(GlobalConfigProcessor.GLOBAL_PACKAGE_SPLIT) : [];
      let globalConfig = require('../default').default;
      this.mergeProperties(globalConfig);
      for (const configPath of configPaths) {
        if (configPath && configPath !== 'undefined') {
          try {
            let extendConfig = cwdRequire(configPath);
            extendConfig = extendConfig.default ? extendConfig.default : extendConfig;
            this.mergeProperties(extendConfig);
            this.loadedConfigPath.push(configPath);
          } catch (err) {
            // info
            consoleLogger.info(`Can't find config from ${configPath}`);
            consoleLogger.warn(err);
          }
        }
      }
      this.initialized = true;
    }
    return this.globalConfig;
  }

  // merge other properties after init
  mergeProperties(properties) {
    try {
      this.globalConfig = extend(true, this.globalConfig, properties);
    } catch (err) {
      // info
      consoleLogger.error(`merge global config error`, err);
    }
  }

  // for test
  clearProperties() {
    this.globalConfig = {};
    this.initialized = false;
  }

}
