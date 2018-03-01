import {ConfigManager} from './ConfigManager';
import {PANDORA_HUB_CONFIG_MANAGER} from '../const';
import {ConsumerManager} from '../object-proxying/ConsumerManager';

export class ConfigClient {

  static async create(consumerManager: ConsumerManager) {
    const configManagerProxy: ConfigManager = await consumerManager.getProxy<ConfigManager>({
      name: PANDORA_HUB_CONFIG_MANAGER
    });
    return new ConfigClient(configManagerProxy);
  }

  configManagerProxy: ConfigManager;
  constructor(configManagerProxy: ConfigManager) {
    this.configManagerProxy = configManagerProxy;
  }

  async subscribe(topic, cb) {
    const config = await this.configManagerProxy.getConfig(topic);
    await this.configManagerProxy.subscribe(topic, cb);
    cb(config);
  }

  async unsubscribe(topic, cb) {
    await this.configManagerProxy.unsubscribe(topic, cb);
  }

  async getConfig(topic?: string) {
    return await this.configManagerProxy.getConfig(topic);
  }

}