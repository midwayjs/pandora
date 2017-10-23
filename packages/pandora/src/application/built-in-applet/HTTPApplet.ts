import {Applet} from '../../domain';
import * as http from 'http';
import {promise} from 'pandora-dollar';

/**
 * Abstract class, provide basic HTTP behaviours
 */
export abstract class HTTPApplet implements Applet {

  type: string;

  server: http.Server;

  constructor() {
    this.type = 'HTTP';
  }

  /**
   * Implement Applet.start(), it will create a server and listening on the port ( given by this.getPort() )
   * @returns {Promise<any>}
   */
  async start() {
    /* istanbul ignore next */
    if (this.server) {
      await this.stop();
    }
    this.server = this.createServer();
    return promise.fromCallback(cb => this.server.listen(this.getPort(), cb));
  }

  /**
   * Implement Applet.stop(), it will close the server
   * @returns {Promise<any>}
   */
  async stop() {
    if (this.server) {
      return promise.fromCallback(cb => this.server.close(cb));
    }
  }

  /**
   * A abstract method, to create a http.Server
   * @returns {"http".Server}
   */
  abstract createServer(): http.Server;

  /**
   * Get which port should listening on
   * @returns {number}
   */
  getPort /* istanbul ignore next */(): number {
    return process.env.PORT || 6001;
  }

}
