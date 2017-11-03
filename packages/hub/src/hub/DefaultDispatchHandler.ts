import {HubClient} from './HubClient';
import {DispatchHandler, HubMessage} from '../domain';

export class DefaultDispatchHandler implements DispatchHandler {

  hubClient: HubClient;
  constructor(hubClient: HubClient) {
    this.hubClient = hubClient;
  }

  async dispatch(message: HubMessage) {
    return {
      echo: message
    };
  }

}