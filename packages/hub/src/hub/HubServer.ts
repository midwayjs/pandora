import {ForceReplyFn, MessagePackage, PublishPackage, ReplyPackage} from '../domain';
import {MessengerClient, MessengerServer} from 'pandora-messenger';
import {
  HUB_SOCKET_NAME, PANDORA_HUB_ACTION_MSG_UP, PANDORA_HUB_ACTION_MSG_DOWN,
  PANDORA_HUB_ACTION_OFFLINE_UP, PANDORA_HUB_ACTION_ONLINE_UP, PANDORA_HUB_ACTION_PUBLISH_UP,
  PANDORA_HUB_ACTION_UNPUBLISH_UP, TIMEOUT_OF_RESPONSE
} from '../const';
import {RouteTable} from './RouteTable';
import {Balancer} from './Balancer';
import {format} from 'util';
import {EventEmitter} from 'events';

/**
 * IPC-Hub
 */
export class HubServer extends EventEmitter {

  protected messengerServer: MessengerServer;
  protected routeTable: RouteTable = new RouteTable;

  /**
   * Count of pending reply transactions
   * @type {number}
   */
  public pendingReplyCount = 0;

  /**
   * Start Hub
   * @return {Promise<void>}
   */
  async start(): Promise<void> {
    if(this.messengerServer) {
      throw new Error('Hub already started');
    }
    this.messengerServer = new MessengerServer({
      name: HUB_SOCKET_NAME,
      responseTimeout: TIMEOUT_OF_RESPONSE
    });
    this.startListen();
    await new Promise((resolve) => {
      this.messengerServer.ready(resolve);
    });
  }

  /**
   * Handle message from clients
   * @param {MessagePackage} message
   * @param {ForceReplyFn} reply
   */
  protected handleMessageIn(message: MessagePackage, reply?: ForceReplyFn) {

    if(message.needReply) {
      this.pendingReplyCount++;
    }
    const originReply = reply;
    reply = (replyData) => {
      this.pendingReplyCount--;
      originReply(replyData);
    };

    // Broadcast to all clients if message.broadcast be true and no message.remote
    // Only broadcast, working in very low level
    if(message.broadcast && !message.remote) {
      try {
        this.messengerServer.broadcast(PANDORA_HUB_ACTION_MSG_DOWN, message);
        if(message.needReply) {
          reply(<ReplyPackage> {success: true});
        }
      } catch (error) {
        if(message.needReply) {
          reply(<ReplyPackage> {success: false, error});
        }
      }
      return;
    }

    try {
      const clients = this.routeTable.selectClients(message.remote);
      if(!clients.length) {
        throw new Error(format('Cannot found any clients by selector: %j', message.remote));
      }
      if(message.broadcast) {
        this.broadcastToClients(clients, message, reply);
      } else {
        this.balanceToClients(clients, message, reply);
      }
    } catch (error) {
      if(message.needReply) {
        reply(<ReplyPackage> {success: false, error});
      }
    }

  }

  /**
   * Handle kind of message as {remote: {}, broadcast: false}
   * @param clients
   * @param message
   * @param reply
   */
  protected balanceToClients(clients, message, reply) {

    const balancer = new Balancer(clients);
    const {client, selector: hitSelector} = balancer.pick();
    const callback = message.needReply ? (error, res: ReplyPackage) => {
      if(error) {
        reply({
          host: hitSelector,
          success: false,
          error: error
        });
      } else {
        reply(res);
      }
    } : null;

    // Dispatch the message to a random client of all selected clients
    client.send(PANDORA_HUB_ACTION_MSG_DOWN, message, callback, message && message.timeout);

  }

  /**
   * Handle kind of message as {remote: {}, broadcast: true}
   * @param clients
   * @param message
   * @param reply
   */
  protected broadcastToClients(clients, message, reply) {

    const expectFoundNumber = clients.length;
    const batchReply: Array<ReplyPackage> = [];

    for (const {selector: hitSelector, client} of clients) {

      const callback = message.needReply ? (error, res: ReplyPackage) => {
        if(error) {
          batchReply.push({
            host: hitSelector,
            success: false,
            error: error
          });
        } else {
          batchReply.push(res);
        }
        if(batchReply.length === expectFoundNumber) {
          reply({
            success: true,
            remote: message.host,
            batchReply
          });
        }
      } : null;

      // Dispatch the message to all selected clients
      client.send(PANDORA_HUB_ACTION_MSG_DOWN, message, callback, message && message.timeout);
    }

  }

  /**
   * Start listen on this.messengerServer
   */
  protected startListen() {
    this.messengerServer.on('connected', (client: MessengerClient) => {
      // this.messengerServer will ignore error
      this.routeTable.setRelation(client, {initialization: true});
    });
    this.messengerServer.on('disconnected', (client: MessengerClient) => {
      // this.messengerServer will ignore error
      const selectors = this.routeTable.getSelectorsByClient(client);
      this.routeTable.forgetClient(client);
      this.emit('client_disconnected', selectors);
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_ONLINE_UP, (message: MessagePackage, reply: ForceReplyFn, client: MessengerClient) => {
      try {
        this.routeTable.setRelation(client, message.host);
        reply(<ReplyPackage> {success: true});
      } catch (error) {
        reply(<ReplyPackage> {success: false, error});
      }
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_OFFLINE_UP, (message: MessagePackage, reply: ForceReplyFn, client: MessengerClient) => {
      try {
        this.routeTable.forgetClient(client);
        reply(<ReplyPackage> {success: true});
      } catch (error) {
        reply(<ReplyPackage> {success: false, error});
      }
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_PUBLISH_UP, (message: PublishPackage, reply: ForceReplyFn, client: MessengerClient) => {
      try {
        this.routeTable.setRelation(client, message.data.selector);
        reply(<ReplyPackage> {success: true});
      } catch (error) {
        reply(<ReplyPackage> {success: false, error});
      }
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_UNPUBLISH_UP, (message: PublishPackage, reply: ForceReplyFn, client: MessengerClient) => {
      try {
        this.routeTable.forgetRelation(client, message.data.selector);
        reply(<ReplyPackage> {success: true});
      } catch (error) {
        reply(<ReplyPackage> {success: false, error});
      }
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_MSG_UP, this.handleMessageIn.bind(this));
  }

  /**
   * Stop listen on this.messengerServer
   */
  protected stopListen() {
    this.messengerServer.removeAllListeners('connected');
    this.messengerServer.removeAllListeners('disconnected');
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_ONLINE_UP);
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_OFFLINE_UP);
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_MSG_UP);
  }

  /**
   * Stop Hub
   * @return {Promise<void>}
   */
  async stop (): Promise<void> {
    if(!this.messengerServer) {
      throw new Error('Hub has not started yet');
    }
    await new Promise((resolve, reject) => {
      this.stopListen();
      this.messengerServer.close((err) => {
        this.messengerServer = null;
        if(err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public getMessengerServer() {
    return this.messengerServer;
  }

}

