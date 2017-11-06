import {Selector, ServiceDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {format} from 'util';
import {ServiceDispatchHandler} from './ServiceDispatchHandler';
import {ServiceUtils} from './ServiceUtils';

export class ProviderManager {

  protected hubClient: HubClient;
  protected serviceMap: Map<string, any> = new Map();

  constructor (hubClient) {
    this.hubClient = hubClient;
    this.hubClient.setDispatchHandler(new ServiceDispatchHandler(this));
  }

  getPublishedService (serviceDescription?: ServiceDescription): Promise<any> {
    const idWithTag = ServiceUtils.serviceDescriptionToId(serviceDescription);
    if(this.serviceMap.has(idWithTag)) {
      return this.serviceMap.get(idWithTag);
    }
    return this.serviceMap.get(serviceDescription.name);
  }

  async publish (impl: any, serviceDescription?: ServiceDescription): Promise<void> {

    const id = ServiceUtils.serviceDescriptionToId(serviceDescription);

    if(this.serviceMap.has(id)) {
      throw new Error(format('service called %j already exist', id));
    }

    let obj = null;
    if(typeof impl === 'function') {
      obj = new impl;
    } else {
      obj = impl;
    }

    this.serviceMap.set(id, obj);

    const location = this.hubClient.getLocation();
    const selector: Selector = {
      ...location,
      serviceName: serviceDescription.name,
      tag: serviceDescription.tag
    };

    await this.hubClient.publish(selector);

  }

}