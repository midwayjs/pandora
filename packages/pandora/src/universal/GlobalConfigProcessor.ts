'use strict';
import {makeRequire} from 'pandora-dollar';
import {PANDORA_CWD, PANDORA_GLOBAL_CONFIG} from '../const';
import {consoleLogger} from './LoggerBroker';
import extend = require('extend');

const GLOBAL_PACKAGE_SPLIT = ':';

const cwd = process.env[PANDORA_CWD] || process.cwd();
const cwdRequire = makeRequire(cwd);
let loadedConfigs = [require('../default').default];
let loadedConfigPath: string[] = [require.resolve('../default')];

function loadResource() {
  const configPaths = process.env[PANDORA_GLOBAL_CONFIG] ? process.env[PANDORA_GLOBAL_CONFIG].split(GLOBAL_PACKAGE_SPLIT) : [];
  for (const configPath of configPaths) {
    if (configPath && configPath !== 'undefined') {
      try {
        let extendConfig = cwdRequire(configPath);
        extendConfig = extendConfig.default ? extendConfig.default : extendConfig;
        loadedConfigs.push(extendConfig);
        loadedConfigPath.push(configPath);
      } catch (err) {
        // info
        consoleLogger.info(`Can't find config from ${configPath}`);
      }
    }
  }
}

export class GlobalConfigProcessor {

  private globalConfig = {};

  static instance;

  private initialized = false;

  static GLOBAL_PACKAGE_SPLIT = GLOBAL_PACKAGE_SPLIT;

  loadedConfigPath = loadedConfigPath;

  static getInstance(): GlobalConfigProcessor {
    if (!this.instance) {
      this.instance = new GlobalConfigProcessor();
    }
    return this.instance;
  }

  getAllProperties(): any {
    if (!this.initialized) {
      for (const preloadConfig of loadedConfigs) {
        this.mergeProperties(preloadConfig);
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
    loadedConfigs = [require('../default').default];
    loadedConfigPath = [require.resolve('../default')];
  }

  // for test
  flushLoadedConfig() {
    loadResource();
  }

}

loadResource();
