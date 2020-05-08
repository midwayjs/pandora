import { HubClient } from '../hub/HubClient';
import { ObjectConsumer } from './ObjectConsumer';
import { ConsumerExtInfo, ObjectDescription } from '../types';
import { DefaultObjectProxy } from './DefaultObjectProxy';
import { ProviderManager } from './ProviderManager';

export class ConsumerManager {
  protected hubClient: HubClient;
  private consumerCache: Map<string, ObjectConsumer>;
  private providerManager: ProviderManager;

  constructor(hubClient, providerManager: ProviderManager) {
    this.hubClient = hubClient;
    this.consumerCache = new Map();
    this.providerManager = providerManager;
  }

  /**
   * Get a Consumer by an ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ConsumerExtInfo} extInfo
   * @return {ObjectConsumer}
   */
  public getConsumer(
    objectDescription: ObjectDescription,
    extInfo?: ConsumerExtInfo
  ): ObjectConsumer {
    const key = objectDescription.name + ':' + objectDescription.tag;
    if (!this.consumerCache.has(key)) {
      const consumer = new ObjectConsumer(
        objectDescription,
        this.hubClient,
        this.providerManager,
        extInfo
      );
      this.consumerCache.set(key, consumer);
      return consumer;
    }
    return this.consumerCache.get(key);
  }

  /**
   * get an Object Proxy by an ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ConsumerExtInfo} extInfo
   * @return {Promise<T & DefaultObjectProxy>}
   */
  public async getProxy<T extends any>(
    objectDescription: ObjectDescription,
    extInfo?: ConsumerExtInfo
  ): Promise<T & DefaultObjectProxy> {
    return this.getConsumer(objectDescription, extInfo).getProxy<T>();
  }
}
