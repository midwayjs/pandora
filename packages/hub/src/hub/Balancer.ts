import {MessengerClient} from 'pandora-messenger';
export class Balancer {

  protected clients: MessengerClient[];
  constructor(clients) {
    this.clients = clients;
    // TODO: assert clients.length
  }

  pick(): MessengerClient {
    const randomInt = getRandomInt(0, this.clients.length);
    return this.clients[randomInt];
  }

}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
