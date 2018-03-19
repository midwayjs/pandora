import {ProviderManager} from '../object-proxying/ProviderManager';
import {PANDORA_HUB_CONFIG_MANAGER} from '../const';

export class ConfigManager {

  static async create(providerManager: ProviderManager) {
    const configManager = new ConfigManager();
    await providerManager.publish(configManager, {
      name: PANDORA_HUB_CONFIG_MANAGER
    });
    return configManager;
  }

  private config = {};
  private callbackStore: Map<string, (...x) => Promise<void>>  = new Map();

  getConfig(topic?) {
    if(topic) {
      return this.config[topic];
    }
    return this.config;
  }

  subscribe(topic, cb) {
    this.callbackStore.set(topic, cb);
  }

  unsubscribe(topic, cb?) {
    this.callbackStore.delete(topic);
  }

  async publish(topic: string, config) {
    this.config[topic] = config;
    const cb = this.callbackStore.get(topic);
    if(cb) {
      await cb(config);
    }
  }

  getAllTopics(prefix?: string) {
    const topics = Object.keys(this.config);
    const ret = [];
    for (const topic of topics) {
      if(!prefix || topic.startsWith(prefix)) {
        ret.push(topic);
      }
    }
    return ret;
  }

  getAllSubscribedTopics(prefix?: string) {
    const topics = this.callbackStore.keys();
    const ret = [];
    for (const topic of topics) {
      if(!prefix || topic.startsWith(prefix)) {
        ret.push(topic);
      }
    }
    return ret;
  }

}

