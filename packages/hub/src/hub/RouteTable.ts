import {Selector, selectorSchema} from '../domain';
import {MessengerClient} from 'pandora-messenger';

// TODO: Increase performance
export class RouteTable {

  mapClientToSelector: Map<MessengerClient, Selector[]> = new Map;

  setRelation(client: MessengerClient, selector: Selector) {
    if(!this.mapClientToSelector.has(client)) {
      this.mapClientToSelector.set(client, []);
    }
    const selectors = this.mapClientToSelector.get(client);
    selectors.push(selector);
  }

  forgetClient(client: MessengerClient) {
    this.mapClientToSelector.delete(client);
  }

  selectClients(selector?: Selector): MessengerClient[] {

    const selectedClients = [];

    for(const [client, targetSelectors] of this.mapClientToSelector) {
      for(const targetSelector of targetSelectors) {
        const found = this.match(selector, targetSelector);
        if(found) {
          selectedClients.push(client);
          break;
        }
      }
    }

    return selectedClients;

  }

  match (selector: Selector, targetSelector: Selector) {

    let found = 0;
    let shouldFound = 0;

    for (const key of selectorSchema) {
      shouldFound++;
      if(!selector[key] || (selector[key] === targetSelector[key])) {
        found++;
      }
    }

    return shouldFound === found;

  }

  getAllClients(): MessengerClient[] {
    return Array.from(this.mapClientToSelector.keys());
  }

}