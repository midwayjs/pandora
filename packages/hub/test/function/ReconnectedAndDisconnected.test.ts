import {expect} from 'chai';
import {HubClient} from '../../src/hub/HubClient';
import {Hub} from '../../src/hub/Hub';

describe('ReconnectedAndDisconnected', () => {

  class TestHub extends Hub {
    getRouteTable () {
      return this.routeTable;
    }
  }

  it('should remove Route Info when client disconnected', async () => {

    const hub = new TestHub;
    const client = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process1',
        pid: '1'
      }
    });

    await hub.start();
    await client.start();

    client.publish({
      ...client.getLocation(),
      serviceName: 'testService'
    });

    const routeTable = hub.getRouteTable();

    const clientsBeforeClose = routeTable.getAllClients();
    expect(clientsBeforeClose.length).to.be.equal(1);

    const selectorsBeforeClose = routeTable.getSelectorsByClient(clientsBeforeClose[0]);
    expect(selectorsBeforeClose.length).to.be.equal(2);

    await client.stop();

    const clientsAfterClose = routeTable.getAllClients();
    expect(clientsAfterClose.length).to.be.equal(0);

    await hub.stop();

  });

  it('should resend all selectors to Hub when reconnected to Hub', async () => {

    const hub1 = new TestHub;
    const client = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process1',
        pid: '1'
      }
    });

    await hub1.start();
    await client.start();

    await client.publish({
      ...client.getLocation(),
      serviceName: 'testService'
    });

    const routeTable1 = hub1.getRouteTable();
    const clients1 = routeTable1.getAllClients();
    expect(clients1.length).to.be.equal(1);
    const selectors1 = routeTable1.getSelectorsByClient(clients1[0]);
    expect(selectors1.length).to.be.equal(3);

    await hub1.stop();

    const hub2 = new TestHub;
    await hub2.start();

    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    const routeTable2 = hub2.getRouteTable();
    const clients2 = routeTable2.getAllClients();
    expect(clients2.length).to.be.equal(1);
    const selectors2 = routeTable2.getSelectorsByClient(clients2[0]);
    expect(selectors2.length).to.be.equal(3);
    expect(selectors2).to.deep.equal(selectors1);

    await client.stop();
    await hub2.stop();

  });

});