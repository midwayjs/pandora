import {Selector, ObjectDescription} from '../domain';
import {HubClient} from '../hub/HubClient';
import {format} from 'util';
import {ObjectDispatchHandler} from './ObjectDispatchHandler';
import {ObjectUtils} from './ObjectUtils';

export class ProviderManager {

  protected hubClient: HubClient;
  protected objectMap: Map<string, any> = new Map();

  constructor (hubClient) {
    this.hubClient = hubClient;
    this.hubClient.setDispatchHandler(new ObjectDispatchHandler(this));
  }

  getPublishedObject (objectDescription?: ObjectDescription): Promise<any> {
    const idWithTag = ObjectUtils.objectDescriptionToId(objectDescription);
    if(this.objectMap.has(idWithTag)) {
      return this.objectMap.get(idWithTag);
    }
    return this.objectMap.get(objectDescription.name);
  }

  async publish (impl: any, objectDescription?: ObjectDescription): Promise<void> {

    const id = ObjectUtils.objectDescriptionToId(objectDescription);

    if(this.objectMap.has(id)) {
      throw new Error(format('object called %j already exist', id));
    }

    let obj = null;
    if(typeof impl === 'function') {
      obj = new impl;
    } else {
      obj = impl;
    }

    this.objectMap.set(id, obj);

    const location = this.hubClient.getLocation();
    const selector: Selector = {
      ...location,
      objectName: objectDescription.name,
      objectTag: objectDescription.tag
    };

    await this.hubClient.publish(selector);

  }

}