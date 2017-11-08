import {DispatchHandler, HubMessage} from '../domain';

export class DefaultDispatchHandler implements DispatchHandler {
  async dispatch(message: HubMessage): Promise<any> {
    if(message.action === 'echo') {
      return {
        echo: message
      };
    }
  }

}