import { expect } from 'chai';
import { RouteTable } from '../../src/hub/RouteTable';
import { MessengerClient } from 'pandora-messenger';
import { Selector } from '../../src/domain';

describe('RouteMap', () => {
  const routeTable = new RouteTable();

  const pairs: Array<[MessengerClient, Selector]> = [
    [
      <MessengerClient>(<any>{ client: '1' }),
      {
        appName: 'testApp',
        processName: 'processA',
        pid: '1',
        objectName: 'objectA',
        objectTag: 'tagA',
      },
    ],
    [
      <MessengerClient>(<any>{ client: '2' }),
      {
        appName: 'testApp',
        processName: 'processB',
        pid: '2',
        objectName: 'objectA',
        objectTag: 'tagA',
      },
    ],
    [
      <MessengerClient>(<any>{ client: '3' }),
      {
        appName: 'testApp2',
        processName: 'processA',
        pid: '3',
        objectName: 'objectA',
        objectTag: 'tagA',
      },
    ],
    [
      <MessengerClient>(<any>{ client: '4' }),
      {
        appName: 'testApp2',
        processName: 'processB',
        pid: '4',
        objectName: 'objectA',
        objectTag: 'tagA',
      },
    ],
  ];

  it('should setRelation() be ok', () => {
    for (const [client, selector] of pairs) {
      routeTable.setRelation(client, selector);
    }
  });

  it('should throw error when setRelation(client, null) be ok', () => {
    expect(() => {
      routeTable.setRelation(<MessengerClient>{}, null);
    }).throw('Selector is required, but got');
  });

  it('should getAllClients() be ok', () => {
    const clients = routeTable.getAllClients();
    expect(clients.length).to.equal(pairs.length);
  });

  it('should selectClients() be ok in case 1', () => {
    const selecteds = routeTable.selectClients({
      appName: 'testApp',
    });

    expect(selecteds.length).to.equal(2);
    expect((<any>selecteds[0].client).client).to.equal('1');
    expect((<any>selecteds[1].client).client).to.equal('2');
  });

  it('should selectClients() be ok in case 2', () => {
    const selecteds = routeTable.selectClients({
      processName: 'processB',
    });

    expect(selecteds.length).to.equal(2);
    expect((<any>selecteds[0].client).client).to.equal('2');
    expect((<any>selecteds[1].client).client).to.equal('4');
  });

  it('should selectClients() be ok in case 3', () => {
    const clients = routeTable.selectClients({
      appName: 'testApp2',
      processName: 'processA',
    });
    expect(clients.length).to.equal(1);
    expect((<any>clients[0].client).client).to.equal('3');
  });

  it('should forgetClient() be ok', () => {
    let times = 0;
    const total = routeTable.getAllClients().length;

    for (const [client] of pairs) {
      times++;
      routeTable.forgetClient(client);
      expect(routeTable.getAllClients().length).to.equal(total - times);
    }
  });

  it('should forgetRelation be ok', () => {
    const client = <MessengerClient>(<any>{ client: 'x' });
    const selector1 = {
      appName: 'testApp1',
      processName: 'processX',
      pid: '1',
      objectName: 'objectX',
      objectTag: 'tagX',
    };

    routeTable.setRelation(client, selector1);
    const selector2 = {
      appName: 'testApp2',
      processName: 'processX',
      pid: '1',
      objectName: 'objectX',
      objectTag: 'tagX',
    };

    routeTable.setRelation(client, selector2);
    expect(routeTable.getSelectorsByClient(client).length).to.equal(2);

    routeTable.forgetRelation(client, {
      appName: 'testApp1',
    });
    expect(routeTable.getSelectorsByClient(client).length).to.equal(1);

    routeTable.forgetRelation(client, {
      appName: 'testApp2',
    });
    expect(routeTable.getSelectorsByClient(client)).to.be.not.ok;

    expect(() => {
      routeTable.forgetRelation(client, {
        appName: 'testApp2',
      });
    }).throw('Can not found client when forgetRelation');
  });
});
