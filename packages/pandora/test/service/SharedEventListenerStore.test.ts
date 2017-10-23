import {expect} from 'chai';
import {SharedEventListenerStore} from '../../src/service/SharedEventListenerStore';

describe('SharedEventListenerStore', function () {

  const store = new SharedEventListenerStore();
  const pair1 = {
    remote: 'remote_1', local: function () {
    }
  };
  const pair2 = {
    remote: null, local: function () {
    }
  };

  it('should registerByRemoteListener() be ok', () => {
    store.registerByRemoteListener(pair1.remote, pair1.local);
  });

  it('should registerByRemoteListener() be ok', () => {
    pair2.remote = store.registerByLocalListener(pair2.local);
  });

  it('should getRemoteListenerByLocalListener() be ok', () => {
    expect(store.getRemoteListenerByLocalListener(pair1.local)).to.be.equal(pair1.remote);
    expect(store.getRemoteListenerByLocalListener(pair2.local)).to.be.equal(pair2.remote);
  });

  it('should getLocalListenerByRemoteListener() be ok', () => {
    expect(store.getLocalListenerByRemoteListener(pair1.remote)).to.be.equal(pair1.local);
    expect(store.getLocalListenerByRemoteListener(pair2.remote)).to.be.equal(pair2.local);
  });

  it('should hasByLocalListener() be ok', () => {
    expect(store.hasByLocalListener(pair1.local)).to.be.equal(true);
    expect(store.hasByLocalListener(pair2.local)).to.be.equal(true);
    expect(store.hasByLocalListener(function () {
    })).to.be.equal(false);
  });

  it('should hasByRemoteListener() be ok', () => {
    expect(store.hasByRemoteListener(pair1.remote)).to.be.equal(true);
    expect(store.hasByRemoteListener(pair2.remote)).to.be.equal(true);
    expect(store.hasByRemoteListener('unknown_remote')).to.be.equal(false);
  });

  it('should deleteByLocalListener() be ok', () => {
    store.deleteByLocalListener(pair1.local);
    expect(store.hasByLocalListener(pair1.local)).to.be.equal(false);
    expect(store.hasByRemoteListener(pair1.remote)).to.be.equal(false);
  });

  it('should deleteByRemoteListener() be ok', () => {
    store.deleteByRemoteListener(pair1.remote);
    expect(store.hasByLocalListener(pair1.local)).to.be.equal(false);
    expect(store.hasByRemoteListener(pair1.remote)).to.be.equal(false);
  });

});
