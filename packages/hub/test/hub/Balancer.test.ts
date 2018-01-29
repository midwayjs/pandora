import {expect} from 'chai';
import {Balancer} from '../../src/hub/Balancer';
import mm = require('mm');

describe('Balancer', function () {

  it('should return [0] directly when there any one client', () => {
    let called = false;
    mm(Balancer, 'getRandomInt', () => {
      called = true;
    });
    const clientInfo = {
      client: null,
      selector: null
    };
    const balancer = new Balancer([clientInfo]);
    expect(balancer.pick()).to.equal(clientInfo);
    expect(called).to.equal(false);
    mm.restore();
  });

  it('should return random client be ok', () => {

    const clients = [];
    const hitCounts = [];

    for(let idx = 0; idx < 5; idx++) {
      hitCounts.push(0);
      clients.push({
        client: null,
        selector: null
      });
    }

    const balancer = new Balancer(clients);

    for(let idx = 0; idx < 100; idx++) {
      const idxOfClients = clients.indexOf(balancer.pick());
      expect(idxOfClients).to.be.gt(-1);
      hitCounts[idxOfClients] += 1;
    }

    let totalCnt = 0;
    for(let idx = 0; idx < hitCounts.length; idx++) {
      expect(hitCounts[idx]).to.be.gt(0);
      totalCnt += hitCounts[idx];
    }

    expect(totalCnt).to.equal(100);

  });
});
