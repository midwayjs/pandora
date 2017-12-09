import {FacadeSetupOptions, Location, ObjectDescription} from './domain';
import {HubClient} from './hub/HubClient';
import {ProviderManager} from './object-proxying/ProviderManager';
import {ConsumerManager} from './object-proxying/ConsumerManager';
import {ObjectConsumer} from './object-proxying/ObjectConsumer';
import {DefaultObjectProxy} from './object-proxying/DefaultObjectProxy';

export class Facade {

  location: Location;
  hubClient: HubClient;
  logger: any;
  providerManager: ProviderManager;
  consumerManager: ConsumerManager;

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
      this.consumerManager = new ConsumerManager(this.getHubClient());
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
   * @return {ObjectConsumer}
   */
  getConsumer(objectDescription: ObjectDescription): ObjectConsumer {
    return this.getConsumerManager().getConsumer(objectDescription);
  }

  /**
   * Get an Object Proxy by an ObjectDescription for Remote Object
   * @param {ObjectDescription} objectDescription
   * @return {Promise<T & DefaultObjectProxy>}
   */
  getProxy <T extends any> (objectDescription: ObjectDescription): Promise<T & DefaultObjectProxy> {
    return this.getConsumerManager().getProxy<T>(objectDescription);
  }

}