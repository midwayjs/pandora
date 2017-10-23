import {Configurator, ConfiguratorLoadOptions} from '../domain';
import {WorkerContextAccessor} from '../application/WorkerContextAccessor';
import {join} from 'path';
import extend = require('extend');

/**
 * Class DefaultConfigurator
 */
export class DefaultConfigurator implements Configurator {

  protected context: WorkerContextAccessor;
  protected configPlace = './config';
  protected resolvedConfig = null;
  constructor(context: WorkerContextAccessor) {
    this.context = context;
  }

  async getAllProperties(options = <ConfiguratorLoadOptions>{force: false}) {
    if(!this.resolvedConfig || options.force)  {
      const appDir = this.context.appDir;
      const configDir = join(appDir, this.configPlace);
      const env = this.context.env;
      this.resolvedConfig = this.loadConfigByFile(configDir, env);
    }
    return this.resolvedConfig;
  }

  protected loadConfigByFile(loadDir, env) {
    const configFiles = [
      './config',
      './config.default',
      `./config.${env}`
    ];
    let config = {};
    for (const fileName of configFiles) {
      try {
        const target = join(loadDir, fileName);
        let mod = require(target);
        mod = mod.default || mod;
        const extendConfig = 'function' === typeof mod ? mod(this.context) : mod;
        config = extend(true, config, extendConfig);
      } catch(err) {
        // Ignore
      }
    }
    return config;
  }

}
