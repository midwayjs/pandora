import {SelectedInfo} from '../domain';

export class Balancer {

  protected clients: Array<SelectedInfo>;
  constructor(clients) {
    this.clients = clients;
  }

  pick(): SelectedInfo {
    if(this.clients.length === 1) {
      return this.clients[0];
    }
    const randomInt = getRandomInt(0, this.clients.length - 1);
    return this.clients[randomInt];
  }

}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
