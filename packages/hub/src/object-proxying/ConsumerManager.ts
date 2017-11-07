import {HubClient} from '../hub/HubClient';
import {ObjectConsumer} from './ObjectConsumer';
import {ObjectDescription} from '../domain';
import {DefaultObjectProxy} from './DefaultObjectProxy';

export class ConsumerManager {

  protected hubClient: HubClient;

  constructor (hubClient) {
    this.hubClient = hubClient;
  }

  public getConsumer (objectDescription: ObjectDescription): ObjectConsumer {
    return new ObjectConsumer(objectDescription, this.hubClient);

  }

  public async getProxy <T extends any> (objectDescription: ObjectDescription): Promise<T & DefaultObjectProxy> {
    return this.getConsumer(objectDescription).getProxy<T>();
  }

}