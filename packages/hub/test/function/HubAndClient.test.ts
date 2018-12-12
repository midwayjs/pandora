import {expect} from 'chai';
import {HubServer} from '../../src/hub/HubServer';
import {HubClient} from '../../src/hub/HubClient';
import {Selector} from '../../src/domain';
describe('HubAndClient', () => {

  class TestHub extends HubServer {
    getRouteTable () {
      return this.routeTable;
    }
  }

  let hub: TestHub;
  let clientA: HubClient;
  let clientB: HubClient;

  before(async () => {
    hub = new TestHub;
    clientA = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process1',
        pid: '1'
      }
    });
    clientB = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process2',
        pid: '2'
      }
    });
    await hub.start();
    await clientA.start();
    await clientB.start();
  });

  after(async () => {
    await clientB.stop();
    await clientA.stop();
    await hub.stop();
  });

  it('should publish selector to Hub be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };
    const publishRes = await clientA.publish(selector);
    expect(publishRes.success).to.equal(true);
    const routeTable = hub.getRouteTable();

    const allClients = routeTable.getAllClients();
    expect(allClients.length).to.equal(2);
    const client = routeTable.selectClients(location)[0].client;
    const selectors = routeTable.getSelectorsByClient(client);
    expect(selectors.length).to.equal(3);
    expect(selectors[2].objectName).to.equal('object1');
  });

  it('should invoke be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };

    const res = await clientB.invoke(selector, 'myAction', {
      action: 'echo',
      data: {
        testData: '1234'
      }
    });
    expect(res.data.echo.data.testData).to.equal('1234');
  });

  it('should unpublish selector to Hub be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };
    const unpublishRes = await clientA.unpublish(selector);
    expect(unpublishRes.success).to.equal(true);

    const routeTable = hub.getRouteTable();
    const client = routeTable.selectClients(location)[0].client;
    const selectors = routeTable.getSelectorsByClient(client);
    expect(selectors.length).to.equal(2);

    const clients = routeTable.selectClients({
      objectName: 'object1'
    });

    expect(clients.length).to.equal(0);

  });


  it('should Balance be ok', async () => {

    const expectTimes = 100;
    const hitCounts = [];
    const clients = [];

    for(let idx = 0; idx < 5; idx++) {
      hitCounts[idx] = 0;
      const client = new HubClient({
        location: {
          appName: 'balanceTest',
          processName: 'process' + idx,
          pid: '90' + idx
        }
      });
      client.on('balanceAction', () => {
        hitCounts[idx] += 1;
      });
      await client.start();
      clients.push(client);
    }

    for(let idx = 0; idx < expectTimes; idx++) {
      await clientA.invoke({ appName: 'balanceTest' }, 'balanceAction', null);
    }

    let totalCnt = 0;
    for(const count of hitCounts) {
      totalCnt += count;
      expect(count).to.be.gt(0);
    }
    expect(totalCnt).to.equal(expectTimes);

    for(const client of clients) {
      await client.stop();
    }

  });

  it('should multipleInvoke be ok', async () => {

    const clientNumber = 5;
    const expectTimes = 100;
    const hitCounts = [];
    const clients = [];

    let gotMsg = true;

    for(let idx = 0; idx < clientNumber; idx++) {
      hitCounts[idx] = 0;
      const client = new HubClient({
        location: {
          appName: 'multipleInvokeTest',
          processName: 'process' + idx,
          pid: '90' + idx
        }
      });
      client.on('multipleInvokeAction', (message) => {
        hitCounts[idx] += 1;
        try {
          expect(message.data.testProperty).to.equal(true);
        } catch (err) {
          gotMsg = false;
        }
      });
      await client.start();
      clients.push(client);
    }

    for(let idx = 0; idx < expectTimes; idx++) {
      const res = await clientA.multipleInvoke({ appName: 'multipleInvokeTest' }, 'multipleInvokeAction', {
        data: {
          testProperty: true
        }
      });
      expect(res.length).to.equal(clientNumber);
    }

    for(const count of hitCounts) {
      expect(count).to.equal(expectTimes);
    }

    expect(gotMsg).to.equal(true);

    for(const client of clients) {
      await client.stop();
    }

  });


});
