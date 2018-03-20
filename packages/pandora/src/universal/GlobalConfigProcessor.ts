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

  public loadedConfigPath: Set<string> = new Set();

  static getInstance(): GlobalConfigProcessor {
    if (!this.instance) {
      this.instance = new GlobalConfigProcessor();
    }
    return this.instance;
  }

  getAllProperties(): any {
    if (!this.initialized) {
      this.initialized = true;
      const cwd = process.env[PANDORA_CWD] || process.cwd();
      const cwdRequire = makeRequire(cwd);
      const configPaths = process.env[PANDORA_GLOBAL_CONFIG] ? process.env[PANDORA_GLOBAL_CONFIG].split(GlobalConfigProcessor.GLOBAL_PACKAGE_SPLIT) : [];
      // set default config first
      configPaths.unshift(require.resolve('../default'));
      for (const configPath of configPaths) {
        if (configPath && configPath !== 'undefined' && !this.loadedConfigPath.has(configPath)) {
          try {
            // require module maybe async method
            // The CompilerDispatcher uses a combination of idle tasks and background tasks to parse and compile lazily parsed functions.
            this.loadedConfigPath.add(configPath);
            let extendConfig = cwdRequire(configPath);
            extendConfig = extendConfig.default ? extendConfig.default : extendConfig;
            this.mergeProperties(extendConfig);
          } catch (err) {
            // info
            this.loadedConfigPath.delete(configPath);
            consoleLogger.info(`Can't find config from ${configPath}`);
          }
        }
      }
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

  getloadedConfigPath() {
    return Array.from(this.loadedConfigPath);
  }

  // for test
  clearProperties() {
    this.globalConfig = {};
    this.initialized = false;
    this.loadedConfigPath.clear();
  }

}
