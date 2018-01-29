import {expect} from 'chai';
import {CommonCache} from '../../../src/util/CommonCache';

describe('/test/unit/util/CommonCache.test.ts', () => {
  it('test CommonCache init without capacity', () => {
    let cache = new CommonCache();
    expect(cache.getCapacity()).to.equal(100);
  });

  it('test CommonCache init use capacity', () => {
    let cache = new CommonCache(200);
    expect(cache.getCapacity()).to.equal(200);
  });

  it('test CommonCache update capacity', () => {
    let cache = new CommonCache();
    cache.updateCapacity(300);
    expect(cache.getCapacity()).to.equal(300);
  });

  it('test CommonCache push data', () => {
    let cache = new CommonCache();
    for (let i of ('0'.repeat(10))) {
      cache.push(i);
    }

    expect(cache.getSize()).to.equal(10);
    cache.clear();
    expect(cache.getSize()).to.equal(0);
  });

  it('test CommonCache push data over max capacity', () => {
    let cache = new CommonCache(10);
    for (let i of ('0'.repeat(20))) {
      cache.push(i);
    }

    expect(cache.getCapacity()).to.equal(10);
    expect(cache.getSize()).to.equal(10);
  });

  it('test CommonCache query data use default value', () => {
    let cache = new CommonCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: Date.now()
      });
    }
    expect(cache.query().length).to.equal(50);
  });

  it('test CommonCache query data use size', () => {
    let cache = new CommonCache(100);
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
    expect(results.length).to.equal(3);
    expect(results[0].data).to.equal('3');
    expect(results[1].data).to.equal('4');
    expect(results[2].data).to.equal('5');
  });

  it('test CommonCache query data use size and order by desc', () => {
    let cache = new CommonCache(100);
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
    expect(results.length).to.equal(3);
    expect(results[0].data).to.equal('5');
    expect(results[1].data).to.equal('4');
    expect(results[2].data).to.equal('3');
  });


  it('test CommonCache query data use time', () => {
    let baseTime = 1483243200000;  // 2017-01-01 12:00:00
    let cache = new CommonCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: baseTime + parseInt(i)
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'date',
      value: 1483243200000 + 5
    });
    expect(results.length).to.equal(10);
    expect(results[0].data).to.equal('5');
    expect(results[9].data).to.equal('5');
  });

  it('test CommonCache query data use time and order by desc', () => {
    let baseTime = 1483243200000;  // 2017-01-01 12:00:00
    let cache = new CommonCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i,
        date: baseTime + parseInt(i)
      });
    }

    // 取最后3条
    let results = cache.query({
      by: 'date',
      value: 1483243200000 + 4,
      order: 'DESC'
    });
    expect(results.length).to.equal(20);
    expect(results[0].data).to.equal('5');
    expect(results[1].data).to.equal('4');
    expect(results[19].data).to.equal('4');
  });

  it('test CommonCache query data use time but date without date key', () => {
    let cache = new CommonCache(100);
    for (let i of ('12345'.repeat(10))) {
      cache.push({
        data: i
      });
    }

    let results = cache.query({
      by: 'time',
      value: 1483243200000 + 5
    });

    expect(results.length).to.equal(50);
  });

});
