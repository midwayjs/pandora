import {Introspection, ServiceDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {SERVICE_ACTION_INTROSPECT, SERVICE_ACTION_INVOKE} from '../const';
import {DefaultServiceProxy} from './DefaultServiceProxy';

export class ServiceConsumer {

  public serviceDescription: ServiceDescription;
  private hubClient: HubClient;
  private serviceProxy: DefaultServiceProxy;

  constructor(serviceDescription: ServiceDescription, hubClient) {
    this.serviceDescription = serviceDescription;
    this.hubClient = hubClient;
  }

  public async invoke(method, params): Promise<any> {
    const res = await this.hubClient.invoke({
      serviceName: this.serviceDescription.name,
      tag: this.serviceDescription.tag
    }, SERVICE_ACTION_INVOKE, {
      method: method,
      data: params
    });
    return res.data;
  }

  public async getProxy<T extends any>(): Promise<T> {
    if(this.serviceProxy) {
      return <any> this.serviceProxy;
    }
    const res = await this.hubClient.invoke({
      serviceName: this.serviceDescription.name,
      tag: this.serviceDescription.tag
    }, SERVICE_ACTION_INTROSPECT, null);
    if(res.error) {
      throw res.error;
    }
    const introspection: Introspection = res.data;
    this.serviceProxy = new DefaultServiceProxy(this, introspection);
    return <any> this.serviceProxy;
  }

}
