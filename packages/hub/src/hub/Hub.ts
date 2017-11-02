import {MessagePackage} from '../domain';
import {MessengerClient, MessengerServer} from 'pandora-messenger';
import {HUB_SOCKET_NAME, PANDORA_HUB_ACTION_MSG_UP, PANDORA_HUB_ACTION_MSG_DOWN,
  PANDORA_HUB_ACTION_OFFLINE_UP, PANDORA_HUB_ACTION_ONLINE_UP} from '../const';
import {RouteMap} from './RouteMap';
import {Balancer} from './Balancer';

export class Hub {

  protected messengerServer: MessengerServer;
  protected routeMap: RouteMap = new RouteMap;

  async start(): Promise<void> {
    if(!this.messengerServer) {
      this.messengerServer = new MessengerServer({
        name: HUB_SOCKET_NAME
      });
    }
    await new Promise((resolve) => {
      this.messengerServer.listen(resolve);
    });
  }

  handleMessageIn(message: MessagePackage, reply) {

    // Broadcast to all clients if message.broadcast be true and no message.remote
    if(message.broadcast && !message.remote) {
      try {
        this.messengerServer.broadcast(PANDORA_HUB_ACTION_MSG_DOWN, message);
        reply({success: true});
      } catch (error) {
        reply({success: false, error});
      }
      return;
    }

    try {
      const clients = this.routeMap.selectClients(message.remote);
      if(message.broadcast) {
        for (const client of clients) {
          // Dispatch the message to all selected clients
          client.send(PANDORA_HUB_ACTION_MSG_DOWN, message);
        }
      } else {
        const balancer = new Balancer(clients);
        const client = balancer.pick();
        // Dispatch the message to a random client of all selected clients
        client.send(PANDORA_HUB_ACTION_MSG_DOWN, message);
      }
      reply({success: true});
    } catch (error) {
      reply({success: false, error});
    }

  }

  startListen() {
    this.messengerServer.on('connected', (client: MessengerClient) => {
      this.routeMap.setRelation(client, null);
    });
    this.messengerServer.on('disconnected', (client: MessengerClient) => {
      this.routeMap.forgetClient(client);
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_ONLINE_UP, (message: MessagePackage, reply, client: MessengerClient) => {
      this.routeMap.setRelation(client, message.host);
      reply({success: true});
    });
    this.messengerServer.on(PANDORA_HUB_ACTION_OFFLINE_UP, (message: MessagePackage, reply, client: MessengerClient) => {
      this.routeMap.forgetClient(client);
      reply({success: true});
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
        this.messengerServer.close((err) => {
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