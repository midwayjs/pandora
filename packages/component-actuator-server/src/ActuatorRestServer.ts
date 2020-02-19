import KOA = require('koa');
import bodyParser = require('koa-bodyparser');
import Router = require('koa-router');

export class ActuatorRestServer {
  server;
  app: KOA;
  config: any;

  constructor(ctx) {
    this.config = ctx.config.actuatorServer;
    this.app = new KOA;
  }

  start(): Promise<void> | void {
    const httpConfig = this.config.http;
    const app = this.app;

    if (httpConfig.middlewares) {
      httpConfig.middlewares.forEach((middleware) => {
        app.use(middleware);
      });
    } else {
      app.use(bodyParser());
    }

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
      return new Promise((resolve) => {
        this.server = app.listen({
          host: httpConfig.host,
          port: httpConfig.port
        }, resolve);
      });
    }
  }

  use(mid) {
    this.app.use(mid);
  }

  stop() {
    if(this.server) {
      this.server.close();
      this.server = null;
    }
  }

}
