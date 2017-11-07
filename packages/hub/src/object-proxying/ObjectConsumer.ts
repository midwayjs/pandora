import {Introspection, ObjectDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {OBJECT_ACTION_GET_PROPERTY, OBJECT_ACTION_INTROSPECT, OBJECT_ACTION_INVOKE} from '../const';
import {DefaultObjectProxy} from './DefaultObjectProxy';

export class ObjectConsumer {

  public objectDescription: ObjectDescription;
  private hubClient: HubClient;
  private objectProxy: DefaultObjectProxy;

  constructor(objectDescription: ObjectDescription, hubClient) {
    this.objectDescription = objectDescription;
    this.hubClient = hubClient;
  }

  public async invoke(method: string, params: any[]): Promise<any> {
    const res = await this.hubClient.invoke({
      objectName: this.objectDescription.name,
      objectTag: this.objectDescription.tag
    }, OBJECT_ACTION_INVOKE, {
      propertyName: method,
      data: params
    });
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  public async getProperty(name: string) {
    const res = await this.hubClient.invoke({
      objectName: this.objectDescription.name,
      objectTag: this.objectDescription.tag
    }, OBJECT_ACTION_GET_PROPERTY, {
      propertyName: name
    });
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

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

  public async getProxy<T extends any>(): Promise<T & DefaultObjectProxy> {
    if(this.objectProxy) {
      return <any> this.objectProxy;
    }
    const introspection = await this.introspect();
    this.objectProxy = new DefaultObjectProxy(this, introspection);
    return <any> this.objectProxy;
  }

}


