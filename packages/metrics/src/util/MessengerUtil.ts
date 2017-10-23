import {MessengerClient, MessengerServer, default as Messenger} from 'pandora-messenger';
import {MetricsConstants} from '../MetricsConstants';

let metricsServer: MessengerServer = null;
let metricsClient: MessengerClient = null;

function initMessenger() {
  metricsServer = Messenger.getServer({
    name: MetricsConstants.SOCKET_FILE_NAME
  });
}

function initClient() {
  metricsClient = Messenger.getClient({
    name: MetricsConstants.SOCKET_FILE_NAME
  });
}

function getDiscoveryKey(name) {
  return [MetricsConstants.SERVER_DISCOVER_KEY_PREFIX, name].join(MetricsConstants.MESSENGER_SPLIT);
}

export function getServer(): MessengerServer {
  if (!metricsServer) {
    initMessenger();
  }
  return metricsServer;
}

export function getClient(): MessengerClient {
  if (!metricsClient) {
    initClient();
  }
  return metricsClient;
}

export class MetricsMessengerServer {

  server = getServer();

  messengerKey: string;

  constructor(messengerKey) {
    this.messengerKey = messengerKey;
  }

  discovery(messengerProcess: (data: any, reply, client: MessengerClient) => void) {
    this.server.on(getDiscoveryKey(this.messengerKey), (data, reply, client) => {
      messengerProcess(data, reply, client);
    });
  }

  close(callback = (() => {})) {
    this.server.close(callback);
  }
}

export class MetricsMessengerClient {

  client = getClient();

  messengerKey: string;

  constructor(messengerKey) {
    this.messengerKey = messengerKey;
  }

  register(data, callback?) {
    this.client.send(getDiscoveryKey(this.messengerKey), data, callback);
  }

  query(CLIENT_KEY, processQuery) {
    this.client.on(CLIENT_KEY, processQuery);
  }

  report(REPORT_KEY, data) {
    this.client.send(REPORT_KEY, data);
  }

  close() {
    this.client.close();
  }

}

