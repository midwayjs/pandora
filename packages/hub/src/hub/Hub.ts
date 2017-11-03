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

export class Hub {

  protected messengerServer: MessengerServer;
  protected routeTable: RouteTable = new RouteTable;

  public pendingReplyCount = 0;

  async start(): Promise<void> {
    if(this.messengerServer) {
      throw new Error('this.messengerServer already exist');
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

  handleMessageIn(message: MessagePackage, reply: ForceReplyFn) {

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
        throw new Error(format('can not found any clients by remote selector: %js', message.remote));
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

  protected balanceToClients(clients, message, reply) {

    const balancer = new Balancer(clients);
    const {client, selector: hintedSelector} = balancer.pick();
    const callback = message.needReply ? (error, res: ReplyPackage) => {
      if(error) {
        reply({
          host: hintedSelector,
          success: false,
          error: error
        });
      } else {
        reply(res);
      }
    } : null;

    // Dispatch the message to a random client of all selected clients
    client.send(PANDORA_HUB_ACTION_MSG_DOWN, message, callback);

  }

  protected broadcastToClients(clients, message, reply) {

    const expectFoundNumber = clients.length;
    const batchReply: Array<ReplyPackage> = [];

    for (const {selector: hintedSelector, client} of clients) {

      const callback = message.needReply ? (error, res: ReplyPackage) => {
        if(error) {
          batchReply.push({
            host: hintedSelector,
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
      client.send(PANDORA_HUB_ACTION_MSG_DOWN, message, callback);
    }

  }

  startListen() {
    this.messengerServer.on('connected', (client: MessengerClient) => {
      this.routeTable.setRelation(client, {unknown: true});
    });
    this.messengerServer.on('disconnected', (client: MessengerClient) => {
      this.routeTable.forgetClient(client);
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_ONLINE_UP, (message: MessagePackage, reply: ForceReplyFn, client: MessengerClient) => {
      this.routeTable.setRelation(client, message.host);
      reply(<ReplyPackage> {success: true});
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_OFFLINE_UP, (message: MessagePackage, reply: ForceReplyFn, client: MessengerClient) => {
      this.routeTable.forgetClient(client);
      reply(<ReplyPackage> {success: true});
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_PUBLISH_UP, (message: PublishPackage, reply: ForceReplyFn, client: MessengerClient) => {
      this.routeTable.setRelation(client, message.data.selector);
      reply(<ReplyPackage> {success: true});
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_UNPUBLISH_UP, (message: PublishPackage, reply: ForceReplyFn, client: MessengerClient) => {
      this.routeTable.forgetRelation(client, message.data.selector);
      reply(<ReplyPackage> {success: true});
    });

    this.messengerServer.on(PANDORA_HUB_ACTION_MSG_UP, this.handleMessageIn.bind(this));
  }

  stopListen() {
    this.messengerServer.removeAllListeners('connected');
    this.messengerServer.removeAllListeners('disconnected');
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_ONLINE_UP);
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_OFFLINE_UP);
    this.messengerServer.removeAllListeners(PANDORA_HUB_ACTION_MSG_UP);
  }

  async stop (): Promise<void> {
    if(this.messengerServer) {
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
  }

}

