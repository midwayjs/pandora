import {HubFacade} from '../../src/HubFacade';
import {HubServer} from '../../src/hub/HubServer';
import {expect} from 'chai';

describe('ObjectSimple', function () {

  class TestHub extends HubServer {
    getRouteTable () {
      return this.routeTable;
    }
  }

  let facade: HubFacade;
  let hub: TestHub;


  before(async () => {
    hub = new TestHub;
    facade = new HubFacade;
    facade.setup({
      location: {
        appName: 'test'
      }
    });
    await hub.start();
    await facade.start();
  });

  after(async () => {
    await facade.stop();
    await hub.stop();
  });


  it('should publish object be ok', async () => {
    await facade.publish(Math, {
      name: 'math',
      tag: 'latest'
    });
    const selectedClients = hub.getRouteTable().selectClients({
      objectName: 'math',
      objectTag: 'latest'
    });
    expect(selectedClients.length).to.equal(1);
  });

  it('should invoke through consumer be ok', async () => {
    const consumer = facade.getConsumer({name: 'math', tag: 'latest'});
    const introspection = await consumer.introspect();
    expect(introspection.methods.length).to.be.gt(0);
    expect(introspection.properties.length).to.be.gt(0);
    const val = await consumer.invoke('abs', [-1234]);
    expect(val).to.equal(1234);
  });

  it('should invoke through proxy be ok', async () => {
    const proxy = await facade.getProxy<Math>({name: 'math', tag: 'latest'});
    const val = await proxy.abs(-1234);
    expect(val).to.equal(1234);
  });

  it('should getProperty through consumer be ok', async () => {
    const consumer = facade.getConsumer({name: 'math', tag: 'latest'});
    const PI = await consumer.getProperty('PI');
    expect(PI).to.equal(Math.PI);
  });

  it('should getProperty through proxy be ok', async () => {
    const proxy = await facade.getProxy<Math>({name: 'math', tag: 'latest'});
    const PI = await proxy.getProperty('PI');
    expect(PI).to.equal(Math.PI);
  });

  it('should throw an error when access a property directly', async () => {
    const proxy = await facade.getProxy<Math>({name: 'math', tag: 'latest'});
    // Will throw an error > Error: Use 'await proxy.getProperty('PI')' to replace 'proxy.PI' when using IPC Object Proxy
    expect(() => proxy.PI).to.throw('proxy.getProperty(\'PI\')');
  });

});
