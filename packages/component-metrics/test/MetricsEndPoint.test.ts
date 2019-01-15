import {expect} from 'chai';
import request = require('supertest');
import {MetricsEndPoint} from '../src/MetricsEndPoint';
import ComponentActuatorServer from 'pandora-component-actuator-server';
import {Server} from 'http';

describe('MetricsEndPoint', () => {

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
    ctx.endPointManager.register(new MetricsEndPoint(ctx));
    server = componentActuatorServer.actuatorRestServer.server;

  });

  after(async () => {
    await componentActuatorServer.stopAtSupervisor();
  });

  it('should /list be ok', async () => {
    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('list');
      return ['test_content1'];
    };
    const res1 = await request(server).get('/metrics/list').expect(200);
    expect(res1.body.success).to.be.equal(true);
    expect(res1.body.data).to.deep.equal(['test_content1']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('list');
      throw new Error('testError1');
    };
    const res2 = await request(server).get('/metrics/list').expect(200);
    expect(res2.body.success).to.be.equal(false);
    expect(res2.body.message).to.be.equal('testError1');
  });

  it('should /list:group be ok', async () => {
    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('list');
      expect(query.group).to.be.equal('testGroup');
      return ['test_content2'];
    };
    const res1 = await request(server).get('/metrics/list/testGroup').expect(200);
    expect(res1.body.success).to.be.equal(true);
    expect(res1.body.data).to.deep.equal(['test_content2']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('list');
      expect(query.group).to.be.equal('testGroup');
      throw new Error('testError2');
    };
    const res2 = await request(server).get('/metrics/list/testGroup').expect(200);
    expect(res2.body.success).to.be.equal(false);
    expect(res2.body.message).to.be.equal('testError2');
  });

  it('should /:group be ok', async () => {
    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('group');
      expect(query.group).to.be.equal('testGroup');
      return ['test_content3'];
    };
    const res1 = await request(server).get('/metrics/testGroup').expect(200);
    expect(res1.body.success).to.be.equal(true);
    expect(res1.body.data).to.deep.equal(['test_content3']);

    indicatorManager.invokeAllProcessesRaw = (group, query) => {
      expect(group).to.be.equal('metrics');
      expect(query.action).to.be.equal('group');
      expect(query.group).to.be.equal('testGroup');
      throw new Error('testError3');
    };
    const res2 = await request(server).get('/metrics/testGroup').expect(200);
    expect(res2.body.success).to.be.equal(false);
    expect(res2.body.message).to.be.equal('testError3');
  });

});
