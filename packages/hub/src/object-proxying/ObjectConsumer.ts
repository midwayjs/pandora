import {ConsumerExtInfo, Introspection, ObjectDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {OBJECT_ACTION_GET_PROPERTY, OBJECT_ACTION_INTROSPECT, OBJECT_ACTION_INVOKE} from '../const';
import {DefaultObjectProxy} from './DefaultObjectProxy';

export class ObjectConsumer {

  public objectDescription: ObjectDescription;
  private hubClient: HubClient;
  private objectProxy: DefaultObjectProxy;
  private timeout: number;

  constructor(objectDescription: ObjectDescription, hubClient, extInfo?: ConsumerExtInfo) {
    this.objectDescription = objectDescription;
    this.hubClient = hubClient;
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
      objectTag: this.objectDescription.tag
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


