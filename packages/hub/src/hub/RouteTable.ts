import {SelectedInfo, Selector} from '../domain';
import {MessengerClient} from 'pandora-messenger';
import {SelectorUtils} from './SelectorUtils';
import {format} from 'util';

// TODO: Increase performance
export class RouteTable {

  mapClientToSelector: Map<MessengerClient, Selector[]> = new Map;

  setRelation(client: MessengerClient, selector: Selector) {
    if(!selector) {
      throw new Error(format( 'selector is required, but got %j', selector));
    }
    if(!this.mapClientToSelector.has(client)) {
      this.mapClientToSelector.set(client, []);
    }
    const selectors = this.mapClientToSelector.get(client);
    selectors.push(selector);
  }

  forgetRelation(client: MessengerClient, selector: Selector) {
    if(!this.mapClientToSelector.has(client)) {
      throw new Error('Can not found client when forgetRelation()');
    }
    const targetSelectors = this.mapClientToSelector.get(client);
    const filteredSelectors: Array<Selector> = [];
    for(const targetSelector of targetSelectors)  {
      if(!SelectorUtils.match(selector, targetSelector)) {
        filteredSelectors.push(targetSelector);
      }
    }
    if(!filteredSelectors.length) {
      this.mapClientToSelector.delete(client);
      return;
    }
    this.mapClientToSelector.set(client, filteredSelectors);
  }

  forgetClient(client: MessengerClient) {
    this.mapClientToSelector.delete(client);
  }

  selectClients(selector?: Selector): Array<SelectedInfo> {

    const selectedClients = [];

    for(const [client, targetSelectors] of this.mapClientToSelector) {
      for(const targetSelector of targetSelectors) {
        const found = SelectorUtils.match(selector, targetSelector);
        if(found) {
          selectedClients.push({client: client, selector});
          break;
        }
      }
    }

    return selectedClients;

  }

  getAllClients(): MessengerClient[] {
    return Array.from(this.mapClientToSelector.keys());
  }

  getSelectorsByClient(client: MessengerClient) {
    return this.mapClientToSelector.get(client);
  }

}