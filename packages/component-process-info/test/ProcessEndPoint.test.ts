import { expect } from 'chai';
import request = require('supertest');
import { ProcessEndPoint } from '../src/ProcessEndPoint';
import ComponentActuatorServer from '@pandorajs/component-actuator-server';
import { Server } from 'http';

describe('ProcessEndPoint', () => {
  let componentActuatorServer: ComponentActuatorServer;
  const indicatorManager: any = {};
  let ctx: any;
  let server: Server;

  before(async () => {
    ctx = {
      indicatorManager,
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
    componentActuatorServer = new ComponentActuatorServer(ctx);
    await componentActuatorServer.startAtSupervisor();
    ctx.endPointManager.register(new ProcessEndPoint(ctx));
    server = componentActuatorServer.actuatorRestServer.server;
  });

  after(async () => {
    await componentActuatorServer.stopAtSupervisor();
  });

  it('should / be ok', async () => {
    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('process');
      expect(query.appName).to.be.equal('testAppName');
      return [
        {
          data: 'test_content1',
        },
      ];
    };
    const res1 = await request(server)
      .get('/process/?appName=testAppName')
      .expect(200);
    expect(res1.body.success).to.be.equal(true);
    expect(res1.body.data).to.deep.equal(['test_content1']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('process');
      expect(query.appName).to.be.equal('testAppName');
      throw new Error('testError1');
    };
    const res2 = await request(server)
      .get('/process/?appName=testAppName')
      .expect(200);
    expect(res2.body.success).to.be.equal(false);
    expect(res2.body.message).to.be.equal('testError1');
  });
});
