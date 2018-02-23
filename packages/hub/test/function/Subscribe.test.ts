import {Facade} from '../../src/Facade';
import {Hub} from '../../src/hub/Hub';
import {expect} from 'chai';

describe('Subscribe', () => {


  class TestHub extends Hub {
    getRouteTable () {
      return this.routeTable;
    }
  }

  let facade: Facade;
  let hub: TestHub;


  before(async () => {
    hub = new TestHub;
    facade = new Facade;
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

  it('should publish subscribable object be ok ', async () => {

      await facade.publish({
        subscribe: async (a, cb) => {
          await cb(a, Date.now());
          await cb(a, Date.now());
          await cb(a, Date.now());
        },
        unsubscribe: (a, b) => {
          console.log('unsubscribe', a, b);
        }
      }, {
        name: 'subscribableTag',
        tag: 'latest'
      });


    const proxy = await facade.getProxy<any>({name: 'subscribableTag', tag: 'latest'});

    await proxy.subscribe('test', (a, b) => {
      console.log(a, b);
    });


  });
});
