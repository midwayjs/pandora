import {HubClient} from '../hub/HubClient';
import {ServiceConsumer} from './ServiceConsumer';
import {ServiceDescription} from '../domain';
import {DefaultServiceProxy} from './DefaultServiceProxy';

export class ConsumerManager {

  protected hubClient: HubClient;

  constructor (hubClient) {
    this.hubClient = hubClient;
  }

  public getConsumer (serviceDescription: ServiceDescription): ServiceConsumer {
    return new ServiceConsumer(serviceDescription, this.hubClient);

  }

  public async getProxy <T extends any> (serviceDescription: ServiceDescription): Promise<T & DefaultServiceProxy> {
    return this.getConsumer(serviceDescription).getProxy<T>();
  }

}