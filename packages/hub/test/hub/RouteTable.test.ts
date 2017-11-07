import {expect} from 'chai';
import {RouteTable} from '../../src/hub/RouteTable';
import {MessengerClient} from 'pandora-messenger';
import {Selector} from '../../src/domain';

describe('RouteMap', function () {

  const routeTable = new RouteTable();

  const pairs: Array<[MessengerClient, Selector]> = [
    [
      <MessengerClient> <any> { client: '1' },
      {
        appName: 'testApp', processName: 'processA', pid: '1',
        objectName: 'objectA', objectTag: 'tagA'
      }
    ],
    [
      <MessengerClient> <any> { client: '2' },
      {
        appName: 'testApp', processName: 'processB', pid: '2',
        objectName: 'objectA', objectTag: 'tagA'
      }
    ],
    [
      <MessengerClient> <any> { client: '3' },
      {
        appName: 'testApp2', processName: 'processA', pid: '3',
        objectName: 'objectA', objectTag: 'tagA'
      }
    ],
    [
      <MessengerClient> <any> { client: '4' },
      {
        appName: 'testApp2', processName: 'processB', pid: '4',
        objectName: 'objectA', objectTag: 'tagA'
      }
    ]
  ];

  it('should setRelation() be ok', () => {
    for(const [client, selector] of pairs) {
      routeTable.setRelation(client, selector);
    }
  });

  it('should getAllClients() be ok', () => {
    const clients = routeTable.getAllClients();
    expect(clients.length).to.be.equal(pairs.length);
  });

  it('should selectClients() be ok in case 1', () => {

    const selecteds = routeTable.selectClients({
      appName: 'testApp'
    });

    expect(selecteds.length).to.be.equal(2);
    expect((<any> selecteds[0].client).client).to.be.equal('1');
    expect((<any> selecteds[1].client).client).to.be.equal('2');

  });

  it('should selectClients() be ok in case 2', () => {

    const selecteds = routeTable.selectClients({
      processName: 'processB'
    });

    expect(selecteds.length).to.be.equal(2);
    expect((<any> selecteds[0].client).client).to.be.equal('2');
    expect((<any> selecteds[1].client).client).to.be.equal('4');

  });

  it('should selectClients() be ok in case 3', () => {

    const clients = routeTable.selectClients({
      appName: 'testApp2',
      processName: 'processA'
    });

    expect(clients.length).to.be.equal(1);
    expect((<any> clients[0].client).client).to.be.equal('3');

  });

  it('should forgetClient() be ok', () => {

    let times = 0;
    let total = routeTable.getAllClients().length;

    for(const [client] of pairs) {
      times++;
      routeTable.forgetClient(client);
      expect(routeTable.getAllClients().length).to.be.equal(total - times);
    }

  });

});
