import {ConsumerExtInfo, Introspection, ObjectDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {
  OBJECT_ACTION_GET_PROPERTY, OBJECT_ACTION_INTROSPECT, OBJECT_ACTION_INVOKE,
  OBJECT_ACTION_SUBSCRIBE, OBJECT_ACTION_UNSUBSCRIBE
} from '../const';
import {DefaultObjectProxy} from './DefaultObjectProxy';
import {ProviderManager} from './ProviderManager';
import EventEmitter = require('events');

export class ObjectConsumer extends EventEmitter {

  public objectDescription: ObjectDescription;
  private hubClient: HubClient;
  private providerManager: ProviderManager;
  private objectProxy: DefaultObjectProxy;
  private timeout: number;

  constructor(objectDescription: ObjectDescription, hubClient, providerManager: ProviderManager, extInfo?: ConsumerExtInfo) {
    super();
    this.objectDescription = objectDescription;
    this.hubClient = hubClient;
    this.providerManager = providerManager;
    if(extInfo) {
      this.timeout = extInfo.timeout;
    }
  }

  /**
   * Invoke a method from Remote Object
   * @param {string} method
   * @param {any[]} params
   * @return {Promise<any>}
   */
  public async invoke(method: string, params: any[]): Promise<any> {
    const res = await this.hubClient.invoke({
      objectName: this.objectDescription.name,
      objectTag: this.objectDescription.tag,
    }, OBJECT_ACTION_INVOKE, {
      timeout: this.timeout,
      propertyName: method,
      data: params
    });
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  /**
   * Get a property from Remote Object
   * @param {string} name
   * @return {Promise<any>}
   */
  public async getProperty(name: string) {
    const res = await this.hubClient.invoke({
      objectName: this.objectDescription.name,
      objectTag: this.objectDescription.tag
    }, OBJECT_ACTION_GET_PROPERTY, {
      timeout: this.timeout,
      propertyName: name
    });
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  public async subscribe(register: string, fn) {

    const cnt = this.listenerCount(register);

    this.addListener(register, fn);

    if(cnt === 0) {

      await this.providerManager.publish({
        callback: (register: string, params: any[]) => {
          this.emit(register, ...params);
        }
      }, {
        ...this.objectDescription,
        name: this.objectDescription.name + '@subscriber'
      });

      const res = await this.hubClient.invoke({
        objectName: this.objectDescription.name,
        objectTag: this.objectDescription.tag,
      }, OBJECT_ACTION_SUBSCRIBE, {
        timeout: this.timeout,
        register: register
      });

      if(res.error) {
        throw res.error;
      }
      return res.data;

    }

  }

  public async unsubscribe(register: string, fn?) {

    if (fn) {
      this.removeListener(register, fn);
    } else {
      this.removeAllListeners(register);
    }

    let res;
    if(this.listenerCount(register) === 0) {
      await this.hubClient.invoke({
        objectName: this.objectDescription.name,
        objectTag: this.objectDescription.tag,
      }, OBJECT_ACTION_UNSUBSCRIBE, {
        timeout: this.timeout,
        register: register
      });
    }

    if(res.error) {
      throw res.error;
    }
    return res.data;

  }

  /**
   * Get Introspection from Remote Object
   * @return {Promise<Introspection>}
   */
  public async introspect(): Promise<Introspection> {
    const res = await this.hubClient.invoke({
      objectName: this.objectDescription.name,
      objectTag: this.objectDescription.tag
    }, OBJECT_ACTION_INTROSPECT, null);
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  /**
   * Get Object Proxy
   * @return {Promise<T & DefaultObjectProxy>}
   */
  public async getProxy<T extends any>(): Promise<T & DefaultObjectProxy> {
    if(this.objectProxy) {
      return <any> this.objectProxy;
    }
    const introspection = await this.introspect();
    this.objectProxy = new DefaultObjectProxy(this, introspection);
    return <any> this.objectProxy;
  }

}


