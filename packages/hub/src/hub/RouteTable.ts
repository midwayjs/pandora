import { SelectedInfo, Selector } from '../types';
import { MessengerClient } from 'pandora-messenger';
import { SelectorUtils } from './SelectorUtils';
import { format } from 'util';

// TODO: Increase performance

/**
 * RouteTable
 */
export class RouteTable {
  mapClientToSelector: Map<MessengerClient, Selector[]> = new Map();

  /**
   * Save a relation between Client and Selector
   * @param {MessengerClient} client
   * @param {Selector} selector
   */
  setRelation(client: MessengerClient, selector: Selector) {
    if (!selector) {
      throw new Error(format('Selector is required, but got %j', selector));
    }
    if (!this.mapClientToSelector.has(client)) {
      this.mapClientToSelector.set(client, []);
    }
    const selectors = this.mapClientToSelector.get(client);
    selectors.push(selector);
  }

  /**
   * Forget a relation between Client and Selector
   * @param {MessengerClient} client
   * @param {Selector} selector
   */
  forgetRelation(client: MessengerClient, selector: Selector) {
    if (!this.mapClientToSelector.has(client)) {
      throw new Error('Can not found client when forgetRelation()');
    }
    const targetSelectors = this.mapClientToSelector.get(client);
    const filteredSelectors: Array<Selector> = [];
    for (const targetSelector of targetSelectors) {
      if (!SelectorUtils.match(selector, targetSelector)) {
        filteredSelectors.push(targetSelector);
      }
    }
    if (!filteredSelectors.length) {
      this.mapClientToSelector.delete(client);
      return;
    }
    this.mapClientToSelector.set(client, filteredSelectors);
  }

  /**
   * Forget a Client and all Selectors belong with it
   * @param {MessengerClient} client
   */
  forgetClient(client: MessengerClient) {
    this.mapClientToSelector.delete(client);
  }

  /**
   * Select clients by Selector
   * @param {Selector} selector
   * @return {Array<SelectedInfo>}
   */
  selectClients(selector?: Selector): Array<SelectedInfo> {
    const selectedClients = [];

    for (const [client, targetSelectors] of this.mapClientToSelector) {
      for (const targetSelector of targetSelectors) {
        const found = SelectorUtils.match(selector, targetSelector);
        if (found) {
          selectedClients.push({ client: client, targetSelectors });
          break;
        }
      }
    }

    return selectedClients;
  }

  /**
   * Get all Clients
   * @return {MessengerClient[]}
   */
  getAllClients(): MessengerClient[] {
    return Array.from(this.mapClientToSelector.keys());
  }

  /**
   * Get all Selectors of a certain Client
   * @param {MessengerClient} client
   * @return {Selector[]}
   */
  getSelectorsByClient(client: MessengerClient) {
    return this.mapClientToSelector.get(client);
  }
}
