import uuid = require('uuid');
import {
  Location, Selector, MessagePackage, ReplyPackage, PublishPackage, LookupPackage, ForceReplyFn,
  DispatchHandler, HubMessage, ClientOptions
} from '../domain';
import {MessengerClient} from 'pandora-messenger';
import {
  HUB_SOCKET_NAME, PANDORA_HUB_ACTION_DISCOVER_UP, PANDORA_HUB_ACTION_MSG_UP, PANDORA_HUB_ACTION_PUBLISH_UP,
  PANDORA_HUB_ACTION_UNPUBLISH_UP, PANDORA_HUB_ACTION_MSG_DOWN, PANDORA_HUB_ACTION_ONLINE_UP,
  PANDORA_HUB_ACTION_OFFLINE_UP, TIMEOUT_OF_RESPONSE
} from '../const';
import {SelectorUtils} from './SelectorUtils';
import {format} from 'util';
import {DefaultDispatchHandler} from './DefaultDispatchHandler';
import {EventEmitter} from 'events';


export class HubClient extends EventEmitter {

  protected location: Location;
  protected messengerClient: MessengerClient = null;
  protected publishedSelectors: Array<Selector> = [];
  protected logger;
  protected dispatchHandlers: DispatchHandler[];

  constructor (options: ClientOptions) {
    super();
    this.location = {
      ...options.location,
      clientId: uuid.v4()
    };
    this.logger = options.logger || console;
    this.dispatchHandlers = [
      new DefaultDispatchHandler(this)
    ];
  }

  /**
   * Set a handler to hand HUB Dispatching message
   * @param {DispatchHandler} dispatchHandler
   */
  public pushDispatchHandler(dispatchHandler: DispatchHandler) {
    this.dispatchHandlers.push(dispatchHandler);
  }

  protected async handleHubDispatch(message: HubMessage): Promise<any> {
    for(const dispatchHandler of this.dispatchHandlers) {
      const ret = await dispatchHandler.dispatch(message);
      if(ret) {
        return ret;
      }
    }
    this.emit(message.action, message);
  }

  /**
   * Let this client online
   * @return {Promise<void>}
   */
  async start() {

    if(this.messengerClient) {
      throw new Error('A messengerClient already exist');
    }

    this.messengerClient = new MessengerClient({
      name: HUB_SOCKET_NAME,
      reConnectTimes: 100,
      responseTimeout: TIMEOUT_OF_RESPONSE
    });

    this.messengerClient.on(PANDORA_HUB_ACTION_MSG_DOWN, async (message: HubMessage, reply: ForceReplyFn) => {
      try {
        let replyPkg: ReplyPackage = null;
        try {
          const data = await this.handleHubDispatch(message);
          replyPkg = {
            host: this.location,
            remote: message.host,
            success: true,
            data: data
          };
        } catch (error) {
          replyPkg = {
            host: this.location,
            remote: message.host,
            success: false,
            error: error
          };
        }
        if(message.needReply) {
          reply(replyPkg);
        }
      } catch (err) {
        this.logger.error('handing PANDORA_HUB_ACTION_MSG_DOWN went wrong, remote message: %j', message);
        this.logger.error(err);
      }
    });

    await new Promise(resolve => {
      this.messengerClient.ready(resolve);
    });

    await this.sendOnline();

    // When reconnected
    this.messengerClient.on('connect', () => {
      this.resendPublishedSelectors().catch((err) => {
        this.logger.error(err);
        this.logger.error('resendPublishedSelectors() went wrong');
      });
    });

  }

  protected async sendOnline () {
    await this.sendToHubAndWaitReply(PANDORA_HUB_ACTION_ONLINE_UP);
  }

  /**
   * Publish a selector to Hub, so Hub will set a relation in RouteTable between client and selector
   * @param {Selector} selector
   * @return {Promise<ReplyPackage>}
   */
  async publish(selector: Selector): Promise<ReplyPackage> {
    // Make sure each selector are unique.
    this.assertExistSelector(selector);
    const res = await this.sendPublishToHub(selector);
    this.publishedSelectors.push(selector);
    return res;
  }

  /**
   * Unpublish a selector to Hub, so Hub will forget the relation in RouteTable between client and selector
   * @param {Selector} selector
   * @return {Promise<ReplyPackage>}
   */
  async unpublish(selector: Selector): Promise<ReplyPackage> {
    const filteredSelectors: Array<Selector> = [];
    const batchReply = [];
    for(const targetSelector of this.publishedSelectors) {
      if(!SelectorUtils.match(selector, targetSelector)) {
        filteredSelectors.push(targetSelector);
        continue;
      }
      const res = await this.sendToHubAndWaitReply<PublishPackage>(PANDORA_HUB_ACTION_UNPUBLISH_UP, {
        data: {
          selector: targetSelector
        }
      });
      batchReply.push(res);
      if(!res.success) {
        throw new Error(format('unpublish selector %j went wrong, cause from Hub: %j', selector, res.error));
      }
    }
    this.publishedSelectors = filteredSelectors;
    return {
      success: true,
      batchReply
    };
  }

  /**
   * Resend all published selectors to HUB when reconnected
   * @return {Promise<void>}
   */
  protected async resendPublishedSelectors () {
    await this.sendOnline();
    for(const selector of this.publishedSelectors) {
      await this.sendPublishToHub(selector);
    }
  }

  /**
   * Get all route relations within Hub
   * @return {Promise<any>}
   */
  async discover() {
    const res = await this.sendToHubAndWaitReply(PANDORA_HUB_ACTION_DISCOVER_UP);
    if(!res.success) {
      throw new Error(format('discover whole hub went wrong, cause from Hub: %j', res.error));
    }
    return res.data;
  }

  /**
   * Lookup route relations by a certain selector
   * @param {Selector} selector
   * @return {Promise<any>}
   */
  async lookup(selector: Selector) {
    const res = await this.sendToHubAndWaitReply<LookupPackage>(PANDORA_HUB_ACTION_DISCOVER_UP, {
      data: {
        selector: selector
      }
    });
    if(!res.success) {
      throw new Error(format('lookup selector %j went wrong, cause from Hub: %j', selector, res.error));
    }
    return res.data;
  }

  /**
   * Invoke a remote Object only from a random one of all selected clients
   * @return {Promise<any>}
   */
  async invoke(remote: Selector, action, message): Promise<ReplyPackage> {
    const res = await this.sendToHubAndWaitReply<HubMessage>(PANDORA_HUB_ACTION_MSG_UP, {
      remote: remote,
      action,
      broadcast: false,
      ...message
    });
    return res;
  }

  /**
   * Invoke a remote Object from all selected clients
   * @param {Selector} remote
   * @param message
   * @return {Promise<Array<ReplyPackage>>}
   */
  async multipleInvoke(remote: Selector, action, message): Promise<Array<ReplyPackage>> {
    const res = await this.sendToHubAndWaitReply<HubMessage>(PANDORA_HUB_ACTION_MSG_UP, {
      remote: remote,
      action,
      broadcast: true,
      ...message
    });
    return res.batchReply;
  }

  /**
   * Send a message to a random one of all selected clients
   * @param remote
   * @param data
   * @return {Promise<void>}
   */
  send(remote: Selector, action, message): void {
    this.sendToHub<HubMessage>(PANDORA_HUB_ACTION_MSG_UP, {
      remote: remote,
      action,
      broadcast: false,
      ...message
    });
  }

  /**
   * Send a message to all selected clients
   * @param remote
   * @param message
   * @return {Promise<void>}
   */
  multipleSend(remote: Selector, action, message): void {
    this.sendToHub<HubMessage>(PANDORA_HUB_ACTION_MSG_UP, {
      remote: remote,
      action,
      broadcast: true,
      ...message
    });
  }

  /**
   * Get location of this client
   * @return {Location}
   */
  getLocation () {
    return this.location;
  }

  /**
   * Send a message to Hub
   */
  protected sendToHub<MessageType extends MessagePackage>(action, message?: MessageType): void {
    message = <any> (message || {});
    message.host = this.location;
    this.messengerClient.send(action, message);
  }

  /**
   * Send a message to Hub and wait reply
   * @param action
   * @param {MessageType} message
   * @return {Promise<ReplyPackage>}
   */
  protected async sendToHubAndWaitReply<MessageType extends MessagePackage>(action, message?: MessageType): Promise<ReplyPackage> {
    message = <any> (message || {});
    message.host = this.location;
    message.needReply = true;
    return new Promise(((resolve, reject) => {
      this.messengerClient.send(action, message, (err, message: ReplyPackage) => {
        if(err) {
          reject(err);
          return;
        }
        resolve(message);
      });
    }));
  }

  /**
   * only send publish message to Hub without state keeping
   * @param {Selector} selector
   * @return {Promise<ReplyPackage>}
   */
  protected async sendPublishToHub(selector: Selector): Promise<ReplyPackage> {
    const res = await this.sendToHubAndWaitReply<PublishPackage>(PANDORA_HUB_ACTION_PUBLISH_UP, {
      data: {
        selector: selector
      }
    });
    if(!res.success) {
      throw new Error(format('publish selector %j went wrong, cause from Hub: %j', selector, res.error));
    }
    return res;
  }

  /**
   * Make sure each selector are unique
   * @param selector
   */
  protected assertExistSelector (selector) {
    for(const targetSelector of this.publishedSelectors) {
      if(SelectorUtils.match(selector, targetSelector)) {
        throw new Error(format('Selector %j already exist', selector));
      }
    }
  }

  /**
   * Close this client
   */
  async stop() {
    await this.sendToHubAndWaitReply(PANDORA_HUB_ACTION_OFFLINE_UP);
    this.messengerClient.close();
    this.messengerClient = null;
  }

}