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

  async start () {
    await this.getHubClient().start();
  }

  async stop () {
    await this.getHubClient().stop();
  }

  getHubClient(): HubClient {
    if(!this.hubClient) {
      this.hubClient = new HubClient({
        location: this.location,
        logger: this.logger
      });
    }
    return this.hubClient;
  }

  getProviderManager(): ProviderManager {
    if(!this.providerManager) {
      this.providerManager = new ProviderManager(this.getHubClient());
    }
    return this.providerManager;
  }

  getConsumerManager(): ConsumerManager {
    if(!this.consumerManager) {
      this.consumerManager = new ConsumerManager(this.getHubClient());
    }
    return this.consumerManager;
  }

  publish (impl: any, objectDescription?: ObjectDescription): Promise<void> {
    return this.getProviderManager().publish(impl, objectDescription);
  }

  getPublishedObject(objectDescription?: ObjectDescription): Promise<any> {
    return this.getProviderManager().getPublishedObject(objectDescription);
  }

  getConsumer(objectDescription: ObjectDescription): ObjectConsumer {
    return this.getConsumerManager().getConsumer(objectDescription);
  }

  getProxy <T extends any> (objectDescription: ObjectDescription): Promise<T & DefaultObjectProxy> {
    return this.getConsumerManager().getProxy<T>(objectDescription);
  }

}