import {expect} from 'chai';
import request = require('supertest');
import {ErrorLogEndPoint} from '../src/ErrorLogEndPoint';
import ComponentActuatorServer from 'pandora-component-actuator-server';
import {Server} from 'http';

describe('ErrorLogEndPoint', () => {

  let componentActuatorServer: ComponentActuatorServer;
  let indicatorManager: any = {};
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
            port: 7002
          }
        }
      }
    };
    componentActuatorServer = new ComponentActuatorServer(ctx);
    await componentActuatorServer.startAtSupervisor();
    ctx.endPointManager.register(new ErrorLogEndPoint(ctx));
    server = componentActuatorServer.actuatorRestServer.server;

  });

  after(async () => {
    await componentActuatorServer.stopAtSupervisor();
  });

  it('should / be ok', async () => {

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('errorLog');
      expect(query.action).to.be.equal('list');
      return ['test_content1'];
    };
    const res1 = await request(server).get('/error/').expect(200);
    expect(res1.body.success).to.be.equal(true);
    expect(res1.body.data).to.deep.equal(['test_content1']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('errorLog');
      expect(query.action).to.be.equal('list');
      expect(query.limit).to.be.equal(50);
      return ['test_content1'];
    };
    const res2 = await request(server).get('/error?limit=50').expect(200);
    expect(res2.body.success).to.be.equal(true);
    expect(res2.body.data).to.deep.equal(['test_content1']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('errorLog');
      expect(query.action).to.be.equal('list');
      throw new Error('testError1');
    };
    const res3 = await request(server).get('/error/').expect(200);
    expect(res3.body.success).to.be.equal(false);
    expect(res3.body.message).to.be.equal('testError1');
  });


});
