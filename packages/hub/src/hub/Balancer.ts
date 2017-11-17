import {SelectedInfo} from '../domain';

/**
 * Balancer
 */
export class Balancer {

  protected clients: Array<SelectedInfo>;
  constructor(clients) {
    this.clients = clients;
  }

  /**
   * Pick a random client
   * @return {SelectedInfo}
   */
  pick(): SelectedInfo {
    if(this.clients.length === 1) {
      return this.clients[0];
    }
    const randomInt = Balancer.getRandomInt(0, this.clients.length - 1);
    return this.clients[randomInt];
  }

  public static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}

