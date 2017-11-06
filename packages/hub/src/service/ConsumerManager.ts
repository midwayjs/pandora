import {HubClient} from '../hub/HubClient';
import {ServiceConsumer} from './ServiceConsumer';
import {ServiceDescription} from '../domain';

export class ConsumerManager {

  protected hubClient: HubClient;

  constructor (hubClient) {
    this.hubClient = hubClient;
  }

  public getConsumer (serviceDescription: ServiceDescription): ServiceConsumer {
    return new ServiceConsumer(serviceDescription, this.hubClient);

  }

  public async getProxy <T> (serviceDescription: ServiceDescription): Promise<T> {
    return this.getConsumer(serviceDescription).getProxy<T>();
  }

}