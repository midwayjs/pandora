import { expect } from 'chai';
import { ActuatorRestServer } from '../src/ActuatorRestServer';
import { EndPointManager } from '../src/EndPointManager';
import request = require('supertest');
import { IEndPoint } from '../src/types';
import bodyParser = require('koa-bodyparser');

describe('ActuatorRestServer', () => {
  let actuatorRestServer: ActuatorRestServer;
  let endPointManager: EndPointManager;
  const ctx: any = {
    config: {
      actuatorServer: {
        http: {
          enabled: true,
          host: '127.0.0.1',
          port: 7002,
        },
      },
    },
  };

  before(() => {
    actuatorRestServer = new ActuatorRestServer(ctx);
    endPointManager = new EndPointManager(actuatorRestServer);
  });

  it('should start be ok', async () => {
    await actuatorRestServer.start();
    const { address, port } = actuatorRestServer.server.address();
    expect(address).to.be.contains(ctx.config.actuatorServer.http.host);
    expect(port).to.be.equal(ctx.config.actuatorServer.http.port);
  });

  it('should path / be ok', async () => {
    const result = await request(actuatorRestServer.server)
      .get('/')
      .expect(200);
    expect(result.text).to.be.equal('Pandora restful service start successful');
  });

  it('should endPoint ok result be ok', async () => {
    const testEndPoint: IEndPoint = {
      prefix: '/test1',
      route(router) {
        router.get('/', ctx => {
          ctx.ok('ok');
        });
      },
    };
    endPointManager.register(testEndPoint);
    const result = await request(actuatorRestServer.server)
      .get('/test1/')
      .expect(200);
    expect(result.body).to.deep.include({
      data: 'ok',
      success: true,
      message: '',
    });
  });

  it('should endPoint fail result be ok', async () => {
    const testEndPoint: IEndPoint = {
      prefix: '/test2',
      route(router) {
        router.get('/', ctx => {
          ctx.fail('fail');
        });
      },
    };
    endPointManager.register(testEndPoint);
    const result = await request(actuatorRestServer.server)
      .get('/test2/')
      .expect(200);
    expect(result.body).to.deep.include({
      success: false,
      message: 'fail',
    });
  });

  it('should stop be ok', async () => {
    await actuatorRestServer.stop();
    expect(actuatorRestServer.server == null).to.be.ok;
    // Test twice for else branch
    await actuatorRestServer.stop();
    expect(actuatorRestServer.server == null).to.be.ok;
  });

  it('should support custom middlewares', async () => {
    const ctx: any = {
      config: {
        actuatorServer: {
          http: {
            enabled: true,
            host: '127.0.0.1',
            port: 7003,
            middlewares: [
              bodyParser(),
              async (ctx, next) => {
                if (ctx.headers['x-auth'] === 'true') {
                  return next();
                } else {
                  return (ctx.body = 'deny');
                }
              },
            ],
          },
        },
      },
    };

    const restServer = new ActuatorRestServer(ctx);
    const manager = new EndPointManager(restServer);

    await restServer.start();

    const endpoint: IEndPoint = {
      prefix: '/middleware',
      route(router) {
        router.get('/', ctx => {
          return (ctx.body = 'ok');
        });
      },
    };

    manager.register(endpoint);
    const deny = await request(restServer.server)
      .get('/middleware')
      .expect(200);
    expect(deny.text).to.equal('deny');

    const ok = await request(restServer.server)
      .get('/middleware')
      .set('x-auth', 'true')
      .expect(200);
    expect(ok.text).to.equal('ok');
  });
});
