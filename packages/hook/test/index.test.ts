'use strict';
const path = require('path');
const childProcess = require('child_process');
import { FakeServer } from './fixtures/fake-mysql-server/FakeServer';
import { createServer } from 'mysql2';
const ClientFlags = require('mysql2/lib/constants/client.js');


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

  it('should http-client and trace remote work ok', done => {
    fork('http-client', done);
  });

  it('should only http-client without trace remote work ok', done => {
    fork('http-client-without-remote', done);
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

    it('should mysql query without callback work ok', done => {
      fork('mysql-no-callback', done);
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

  describe('should mysql2 work ok', () => {
    let server;

    before(function() {
      server = createServer();
      server.on('connection', function(conn) {
        conn.on('error', function() {
          console.log('client drop connection');
        });

        let flags = 0xffffff;
        flags = flags ^ ClientFlags.COMPRESS;

        conn.serverHandshake({
          protocolVersion: 10,
          serverVersion: 'node.js rocks',
          connectionId: 1234,
          statusFlags: 2,
          characterSet: 8,
          capabilityFlags: flags
        });
      });
      server.listen(32883);
    });

    it('should mysql2 query work ok', done => {
      fork('mysql2', done);
    });

    it('should mysql2 promise query work ok', done => {
      fork('mysql2-promise', done);
    });

    it('should mysql2 pool query work ok', done => {
      fork('mysql2-pool', done);
    });

    it('should mysql2 pool cluster query work ok', done => {
      fork('mysql2-pool-cluster', done);
    });

    it('should mysql2 integrate work ok', done => {
      fork('mysql2-integrate', done);
    });

    after(function() {
      server.close();
    });
  });
});

describe('integration test', () => {
  it('should trace work', done => {
    fork('integrate', done);
  });
});
