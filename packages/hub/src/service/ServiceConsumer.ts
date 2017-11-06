import {Introspection, ServiceDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {SERVICE_ACTION_GET_PROPERTY, SERVICE_ACTION_INTROSPECT, SERVICE_ACTION_INVOKE} from '../const';
import {DefaultServiceProxy} from './DefaultServiceProxy';

export class ServiceConsumer {

  public serviceDescription: ServiceDescription;
  private hubClient: HubClient;
  private serviceProxy: DefaultServiceProxy;

  constructor(serviceDescription: ServiceDescription, hubClient) {
    this.serviceDescription = serviceDescription;
    this.hubClient = hubClient;
  }

  public async invoke(method: string, params: any[]): Promise<any> {
    const res = await this.hubClient.invoke({
      serviceName: this.serviceDescription.name,
      tag: this.serviceDescription.tag
    }, SERVICE_ACTION_INVOKE, {
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
      serviceName: this.serviceDescription.name,
      tag: this.serviceDescription.tag
    }, SERVICE_ACTION_GET_PROPERTY, {
      propertyName: name
    });
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  public async introspect(): Promise<Introspection> {
    const res = await this.hubClient.invoke({
      serviceName: this.serviceDescription.name,
      tag: this.serviceDescription.tag
    }, SERVICE_ACTION_INTROSPECT, null);
    if(res.error) {
      throw res.error;
    }
    return res.data;
  }

  public async getProxy<T extends any>(): Promise<T> {
    if(this.serviceProxy) {
      return <any> this.serviceProxy;
    }
    const introspection = await this.introspect();
    this.serviceProxy = new DefaultServiceProxy(this, introspection);
    return <any> this.serviceProxy;
  }

}
