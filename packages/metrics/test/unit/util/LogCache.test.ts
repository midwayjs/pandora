import {expect} from 'chai';
import {LogCache} from '../../../src/util/LogCache';

describe('/test/unit/util/LogCache.test.ts', () => {
  it('test LogCache init without capacity', () => {
    let cache = new LogCache();
    expect(cache.getCapacity()).to.be.equal(100);
  });

  it('test LogCache init use capacity', () => {
    let cache = new LogCache(200);
    expect(cache.getCapacity()).to.be.equal(200);
  });

  it('test LogCache update capacity', () => {
    let cache = new LogCache();
    cache.updateCapacity(300);
    expect(cache.getCapacity()).to.be.equal(300);
  });

  it('test LogCache push data', () => {
    let cache = new LogCache();
    for (let i of ('0'.repeat(10))) {
      cache.push(i);
    }

    expect(cache.getSize()).to.be.equal(10);
    cache.clear();
    expect(cache.getSize()).to.be.equal(0);
  });

  it('test LogCache push data over max capacity', () => {
    let cache = new LogCache(10);
    for (let i of ('0'.repeat(20))) {
      cache.push(i);
    }

    expect(cache.getCapacity()).to.be.equal(10);
    expect(cache.getSize()).to.be.equal(10);
  });

  it('test LogCache query data use default value', () => {
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: Date.now()
      });
    }
    expect(cache.query().length).to.be.equal(50);
  });

  it('test LogCache query data use size', () => {
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: Date.now()
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'size',
      value: 3,
    });
    expect(results.length).to.be.equal(3);
    expect(results[0].data).to.be.equal('3');
    expect(results[1].data).to.be.equal('4');
    expect(results[2].data).to.be.equal('5');
  });

  it('test LogCache query data use size and order by desc', () => {
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: Date.now()
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'size',
      value: 3,
      order: 'DESC'
    });
    expect(results.length).to.be.equal(3);
    expect(results[0].data).to.be.equal('5');
    expect(results[1].data).to.be.equal('4');
    expect(results[2].data).to.be.equal('3');
  });


  it('test LogCache query data use time', () => {
    let baseTime = 1483243200000;  // 2017-01-01 12:00:00
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: baseTime + parseInt(i)
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'time',
      value: 1483243200000 + 5
    });
    expect(results.length).to.be.equal(10);
    expect(results[0].data).to.be.equal('5');
    expect(results[9].data).to.be.equal('5');
  });

  it('test LogCache query data use time and order by desc', () => {
    let baseTime = 1483243200000;  // 2017-01-01 12:00:00
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: baseTime + parseInt(i)
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'time',
      value: 1483243200000 + 4,
      order: 'DESC'
    });
    expect(results.length).to.be.equal(20);
    expect(results[0].data).to.be.equal('5');
    expect(results[1].data).to.be.equal('4');
    expect(results[19].data).to.be.equal('4');
  });

  it('test LogCache query data use time but date without date key', () => {
    let cache = new LogCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i
      });
    }

    let results = cache.query({
      by: 'time',
      value: 1483243200000 + 5
    });

    expect(results.length).to.be.equal(50);
  });

});
