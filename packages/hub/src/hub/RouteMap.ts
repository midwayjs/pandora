import {Selector} from '../domain';
import {MessengerClient} from 'pandora-messenger';

export class RouteMap {
  map: Map<MessengerClient, Selector> = new Map;

  setRelation(client, selector: Selector) {
    this.map.set(client, selector);
  }

  forgetClient(client) {
    this.map.delete(client);
  }

  selectClients(selector?: Selector): MessengerClient[] {
    return [];
  }

  getAllClients(): MessengerClient[] {
    return Array.from(this.map.keys());
  }

}