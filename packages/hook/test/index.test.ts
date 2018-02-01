const path = require('path');
const childProcess = require('child_process');
import { FakeMySQLServer } from './helpers/fake-mysql-server/FakeMySQLServer';
import { createServer } from 'mysql2';
import { FakeRedisServer } from './helpers/fake-redis-server/FakeRedisServer';
const ClientFlags = require('mysql2/lib/constants/client.js');

const fork = function(name, done) {
  const filePath = require.resolve(path.join(__dirname, `fixtures/${name}`));
  const worker = childProcess.fork(filePath, {
    env: {
      ...process.env,
      NODE_ENV: 'test'
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
  it('should bluebird work ok', done => {
    fork('bluebird', done);
  });

  describe('error log', () => {
    it('should global work', done => {
      fork('global', done);
    });

    it('should egg-logger work ok', done => {
      fork('egg-logger', done);
    });
  });

  describe('http server', () => {
    it('should normal trace record', done => {
      fork('http', done);
    });

    it('should error trace record', done => {
      fork('http-error', done);
    });

    it('should slow trace record', done => {
      fork('http-slow', done);
    });

    it('should timeout trace record', done => {
      fork('http-timeout', done);
    });
  });

  describe('http client', () => {
    it('should http-client and trace remote work ok', done => {
      fork('http-client', done);
    });

    it('should only http-client without trace remote work ok', done => {
      fork('http-client-without-remote', done);
    });

    it('should urllib work ok', done => {
      fork('urllib', done);
    });
  });

  describe('mysql', () => {
    const fakeServerPort = 32893;
    let fakeServer;

    before((done) => {
      fakeServer = new FakeMySQLServer();
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

  describe('redis', () => {
    let server1, server2;

    const slotTable = [
      [0, 1, ['127.0.0.1', 30001]],
      [2, 5460, ['127.0.0.1', 30002]]
    ];

    before(() => {
      let valueSet;

      server1 = new FakeRedisServer(30001, function(argv) {
        if (argv[0] === 'get') {
          return valueSet;
        }

        if (argv[0] === 'set') {
          valueSet = argv[2];
          return;
        }

        if (argv[0] === 'cluster' && argv[1] === 'slots') {
          return slotTable;
        }
      });

      server2 = new FakeRedisServer(30002, function(argv) {
        if (argv[0] === 'get') {
          return valueSet;
        }

        if (argv[0] === 'set') {
          valueSet = argv[2];
          return;
        }

        if (argv[0] === 'cluster' && argv[1] === 'slots') {
          return slotTable;
        }
      });
    });

    it('should redis promise work ok', done => {
      fork('redis-promise', done);
    });

    it('should redis callback work ok', done => {
      fork('redis-callback', done);
    });

    it('should redis cluster work ok', done => {
      fork('redis-cluster', done);
    });

    after(function() {
      server1.disconnect();
      server2.disconnect();
    });
  });
});

describe('integration test', () => {
  it('should trace work', done => {
    fork('integrate', done);
  });
});
