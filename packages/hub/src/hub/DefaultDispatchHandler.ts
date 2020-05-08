import { DispatchHandler, HubMessage } from '../types';

/**
 * DefaultDispatchHandler
 * Implemented echo action
 */
export class DefaultDispatchHandler implements DispatchHandler {
  /**
   * dispatch
   * @param {HubMessage} message
   * @return {Promise<any>}
   */
  async dispatch(message: HubMessage): Promise<any> {
    if (message.action === 'echo') {
      return {
        echo: message,
      };
    }
  }
}
