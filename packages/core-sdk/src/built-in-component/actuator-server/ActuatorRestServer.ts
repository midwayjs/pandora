import KOA = require('koa');
import bodyParser = require('koa-bodyparser');
import Router = require('koa-router');
import {consoleLogger} from 'pandora-dollar';

export class ActuatorRestServer {

  server;
  app: KOA;
  config: any;

  constructor(ctx) {
    this.config = ctx.config.actuatorServer;
    this.app = new KOA;
  }

  start() {
    const httpConfig = this.config.http;
    const app = this.app;
    app.use(bodyParser());
    let homeRouter = new Router();
    homeRouter.get('/', async (ctx) => {
      ctx.body = 'Pandora restful service start successful';
    });
    app.use(homeRouter.routes());
    app.use(async (ctx, next) => {
      ctx.ok = (data) => {
        ctx.body = {
          data,
          timestamp: Date.now(),
          success: true,
          message: ''
        };
      };
      ctx.fail = (message) => {
        ctx.body = {
          success: false,
          timestamp: Date.now(),
          message
        };
      };
      await next();
    });
    if(httpConfig.enabled) {
      this.server = app.listen(httpConfig.port, () => {
        consoleLogger.info(`Pandora restful server start at http://127.1:${httpConfig.port}`);
      });
    }
  }

  use(mid) {
    this.app.use(mid);
  }

  stop() {
    if(this.server) {
      this.server.close();
    }
  }

}
