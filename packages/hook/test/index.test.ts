'use strict';
const path = require('path');
const childProcess = require('child_process');
// const mysql = require('mysql');
import { FakeServer } from './fixtures/fake-mysql-server/FakeServer';

const fork = function(name, done) {
  const filePath = require.resolve(path.join(__dirname, `fixtures/${name}`));
  const worker = childProcess.fork(filePath, {
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    execArgv: [
      '-r', 'ts-node/register',
      '-r', 'nyc-ts-patch',
      '-r', path.join(__dirname, './TestHelper.ts')
    ]
  });
  worker.on('message', (data) => {
    if (data === 'done') {
      worker.kill();
      done();
    }
  });
};

describe('unit test', () => {
  it('should global work', done => {
    fork('global', done);
  });

  it('should egg-logger work ok', done => {
    fork('egg-logger', done);
  });

  it('should urllib work ok', done => {
    fork('urllib', done);
  });

  it('should http and trace work ok', done => {
    fork('http', done);
  });

  it('should http-client and trace work ok', done => {
    fork('http-client', done);
  });

  it('should bluebird work ok', done => {
    fork('bluebird', done);
  });

  describe('should mysql work ok', () => {
    const fakeServerPort = 32893;
    let fakeServer;

    before((done) => {
      fakeServer = new FakeServer();
      fakeServer.listen(fakeServerPort, done);
    });

    it('should mysql query work ok', done => {
      fork('mysql', done);
    });

    it('should mysql pool query work ok', done => {
      fork('mysql-pool', done);
    });

    it('should mysql pool cluster query work ok', done => {
      fork('mysql-pool-cluster', done);
    });

    it('should mysql integrate work ok', done => {
      fork('mysql-integrate', done);
    });

    after(function() {
      fakeServer.destroy();
    });
  });
});

describe('integration test', () => {
  it('should trace work', done => {
    fork('integrate', done);
  });
});
