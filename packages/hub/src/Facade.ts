import {Location, ServiceDescription} from './domain';
import {FacadeSetupOptions, HubClient} from './hub/HubClient';
import {ProviderManager} from './service/ProviderManager';
import {ConsumerManager} from './service/ConsumerManager';
import {ServiceConsumer} from './service/ServiceConsumer';

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

  publish (impl: any, serviceDescription?: ServiceDescription): Promise<void> {
    return this.getProviderManager().publish(impl, serviceDescription);
  }

  getPublishedService(serviceDescription?: ServiceDescription): Promise<any> {
    return this.getProviderManager().getPublishedService(serviceDescription);
  }

  getConsumer(serviceDescription: ServiceDescription): ServiceConsumer {
    return this.getConsumerManager().getConsumer(serviceDescription);
  }

  getProxy <T> (serviceDescription: ServiceDescription): Promise<T> {
    return this.getConsumerManager().getProxy<T>(serviceDescription);
  }

}