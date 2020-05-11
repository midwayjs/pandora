import { HubFacade } from '../../src/HubFacade';
import { HubServer } from '../../src/hub/HubServer';
import { expect } from 'chai';

describe('Subscribe', () => {
  class TestHub extends HubServer {
    getRouteTable() {
      return this.routeTable;
    }
  }

  let facade: HubFacade;
  let hub: TestHub;

  before(async () => {
    hub = new TestHub();
    facade = new HubFacade();
    facade.setup({
      location: {
        appName: 'test',
      },
    });
    await hub.start();
    await facade.start();
  });

  after(async () => {
    await facade.stop();
    await hub.stop();
  });

  let proxy;
  let publisherSideCb = null;
  let lastGot = null;

  it('should publish subscribable object be ok ', async () => {
    await facade.publish(
      {
        subscribe: async (type, cb) => {
          expect(type).to.be.equal('testType');
          publisherSideCb = cb;
        },
        unsubscribe: async (type, cb?) => {
          expect(type).to.be.equal('testType');
          expect(publisherSideCb).to.be.equal(cb);
          publisherSideCb = null;
        },
      },
      { name: 'subscribableObject', tag: 'latest' }
    );

    proxy = await facade.getProxy<any>({
      name: 'subscribableObject',
      tag: 'latest',
    });

    await proxy.subscribe('testType', (a, b) => {
      lastGot = [a, b];
    });
  });

  it('should callback be ok / 1', async () => {
    await publisherSideCb('1_arg1', '1_arg2');
    expect(lastGot).to.be.deep.equal(['1_arg1', '1_arg2']);
  });

  it('should callback be ok / 2', async () => {
    await publisherSideCb('2_arg1', '2_arg2');
    expect(lastGot).to.be.deep.equal(['2_arg1', '2_arg2']);
  });

  it('should unpublish be ok', async () => {
    const cbx = publisherSideCb;
    await proxy.unsubscribe('testType');
    expect(publisherSideCb).to.be.null;
    await cbx('3_arg1', '3_arg2');
  });
});
