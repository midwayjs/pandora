import Router = require('koa-router');
import {IEndPoint} from './domain';
import {ActuatorRestServer} from './ActuatorRestServer';

export class EndPointManager {
  server: ActuatorRestServer;
  constructor(server: ActuatorRestServer) {
    this.server = server;
  }
  register(endPoint: IEndPoint) {
    const server: ActuatorRestServer = this.server;
    const allPrefixes: string[] = endPoint.aliasPrefix ? [endPoint.prefix].concat(endPoint.aliasPrefix) : [endPoint.prefix];
    for(const prefix of allPrefixes) {
      const router = new Router();
      router.prefix(prefix);
      endPoint.route(router);
      server.use(router.routes());
      server.use(router.allowedMethods());
    }
  }
}