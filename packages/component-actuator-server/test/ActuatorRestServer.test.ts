import {expect} from 'chai';
import {ActuatorRestServer} from '../src/ActuatorRestServer';
import {EndPointManager} from '../src/EndPointManager';
import request = require('supertest');
import {IEndPoint} from '../src/domain';

describe('ActuatorRestServer', function () {

  let actuatorRestServer: ActuatorRestServer;
  let endPointManager: EndPointManager;
  const ctx: any = {
    config: {
      actuatorServer: {
        http: {
          enabled: true,
          host: '127.0.0.1',
          port: 7002
        }
      }
    }
  };

  before(() => {
    actuatorRestServer = new ActuatorRestServer(ctx);
    endPointManager = new EndPointManager(actuatorRestServer);
  });

  it('should start be ok', async () => {
    await actuatorRestServer.start();
    const {address, port} = actuatorRestServer.server.address();
    expect(address).to.be.contains(ctx.config.actuatorServer.http.host);
    expect(port).to.be.equal(ctx.config.actuatorServer.http.port);
  });

  it('should path / be ok', async () => {
    const result = await request(actuatorRestServer.server).get('/').expect(200);
    expect(result.text).to.be.equal('Pandora restful service start successful');
  });

  it('should endPoint ok result be ok', async () => {
    const testEndPoint: IEndPoint = {
      prefix: '/test1',
      route(router) {
        router.get('/', (ctx) => {
          ctx.ok('ok');
        });
      }
    };
    endPointManager.register(testEndPoint);
    const result = await request(actuatorRestServer.server).get('/test1/').expect(200);
    expect(result.body).to.deep.include({
      data: 'ok',
      success: true,
      message: ''
    });
  });

  it('should post unsupport encoding be ok', async () => {
    const encodingEndPoint: IEndPoint = {
      prefix: '/encoding',
      route(router) {
        router.post('/', (ctx) => {
          console.log('ctx.request.body: ', ctx.request.body);
          ctx.ok(ctx.request.body);
        });
      }
    };
    endPointManager.register(encodingEndPoint);
    const result = await request(actuatorRestServer.server)
      .post('/encoding/')
      .send('encoding')
      .set('Content-Type', 'text/plain; charset=ISO-8859-1')
      .set('Content-Encoding', 'UTF-8')
      .expect(200);
    expect(result.body.data).to.equal('encoding');
  });

  it('should endPoint fail result be ok', async () => {
    const testEndPoint: IEndPoint = {
      prefix: '/test2',
      route(router) {
        router.get('/', (ctx) => {
          ctx.fail('fail');
        });
      }
    };
    endPointManager.register(testEndPoint);
    const result = await request(actuatorRestServer.server).get('/test2/').expect(200);
    expect(result.body).to.deep.include({
      success: false,
      message: 'fail'
    });
  });

  it('should stop be ok', async () => {
    await actuatorRestServer.stop();
    expect(actuatorRestServer.server == null).to.be.ok;
    // Test twice for else branch
    await actuatorRestServer.stop();
    expect(actuatorRestServer.server == null).to.be.ok;
  });


});
