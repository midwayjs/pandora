import {FacadeSetupOptions, Location, ObjectDescription, ConsumerExtInfo} from './domain';
import {HubClient} from './hub/HubClient';
import {ProviderManager} from './object-proxying/ProviderManager';
import {ConsumerManager} from './object-proxying/ConsumerManager';
import {ObjectConsumer} from './object-proxying/ObjectConsumer';
import {DefaultObjectProxy} from './object-proxying/DefaultObjectProxy';
import {ConfigManager} from './config-manager/ConfigManager';
import {ConfigClient} from './config-manager/ConfigClient';

export class Facade {

  location: Location;
  hubClient: HubClient;
  logger: any;
  providerManager: ProviderManager;
  consumerManager: ConsumerManager;
  configManager: ConfigManager;
  configClient: ConfigClient;

  setup (options: FacadeSetupOptions) {
    this.location = options.location;
    this.logger = options.logger || console;
  }

  /**
   * Start Client
   * @return {Promise<void>}
   */
  async start () {
    if(!this.getHubClient().isReady()) {
      await this.getHubClient().start();
    }
  }

  /**
   * Stop Client
   * @return {Promise<void>}
   */
  async stop () {
    if(this.getHubClient().isReady()) {
      await this.getHubClient().stop();
    }
  }

  /**
   * Get HubClient
   * @return {HubClient}
   */
  getHubClient(): HubClient {
    if(!this.hubClient) {
      this.hubClient = new HubClient({
        location: this.location,
        logger: this.logger
      });
    }
    return this.hubClient;
  }

  /**
   * Get ProviderManager
   * @return {ProviderManager}
   */
  getProviderManager(): ProviderManager {
    if(!this.providerManager) {
      this.providerManager = new ProviderManager(this.getHubClient());
    }
    return this.providerManager;
  }

  /**
   * Get ConsumerManager
   * @return {ConsumerManager}
   */
  getConsumerManager(): ConsumerManager {
    if(!this.consumerManager) {
      this.consumerManager = new ConsumerManager(this.getHubClient(), this.getProviderManager());
    }
    return this.consumerManager;
  }

  /**
   * Publish an Object to Hub
   * @param impl
   * @param {ObjectDescription} objectDescription
   * @return {Promise<void>}
   */
  publish(impl: any, objectDescription?: ObjectDescription): Promise<void> {
    return this.getProviderManager().publish(impl, objectDescription);
  }

  /**
   * Get a Consumer by an ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ConsumerExtInfo} extInfo
   * @return {ObjectConsumer}
   */
  getConsumer(objectDescription: ObjectDescription, extInfo?: ConsumerExtInfo): ObjectConsumer {
    return this.getConsumerManager().getConsumer(objectDescription, extInfo);
  }

  /**
   * Get an Object Proxy by an ObjectDescription for Remote Object
   * @param {ObjectDescription} objectDescription
   * @param {ConsumerExtInfo} extInfo
   * @return {Promise<T & DefaultObjectProxy>}
   */
  getProxy <T extends any> (objectDescription: ObjectDescription, extInfo?: ConsumerExtInfo): Promise<T & DefaultObjectProxy> {
    return this.getConsumerManager().getProxy<T>(objectDescription, extInfo);
  }

  async initConfigManager() {
    if(!this.configManager) {
      this.configManager = await ConfigManager.create(this.getProviderManager());
    }
  }

  async initConfigClient() {
    if(!this.configClient) {
      this.configClient = await ConfigClient.create(this.getConsumerManager());
    }
  }

  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getConfigClient(): ConfigClient {
    return this.configClient;
  }

}