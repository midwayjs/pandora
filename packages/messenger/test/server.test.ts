'use strict';
import messenger from '../src';

const assert = require('assert');
const Client = messenger.Client;
const Server = messenger.Server;

describe('test/server.test.js', () => {
  const name = 'midway-messenger';

  const msg = {
    name: name,
  };
  const action = 'midway-messenger-action';
  let server;

  before(done => {
    server = new Server({
      name,
    });
    server.ready(done);
  });

  after(() => {
    server.close();
  });

  it('should server broadcast message ok', done => {
    const count = 3;

    function getClient() {
      const client = new Client({
        name,
      });
      return new Promise(resolve => {
        client.ready(() => {
          resolve(client);
        });
      });
    }

    function getClients() {
      const clients = [];
      for (let i = 0; i < count; i++) {
        clients.push(getClient());
      }
      return clients;
    }

    Promise.all(getClients())
      .then(clients => {
        process.nextTick(() => {
          server.broadcast(action, msg);
        });

        return Promise.all(
          clients.map(client => {
            return new Promise(resolve => {
              client.on(action, message => {
                assert(message.name === msg.name);
                resolve();
              });
            });
          })
        );
      })
      .then(() => {
        done();
      })
      .catch(() => {
        assert(false);
      });
  });

  it('should server broadcast message ok before any clients connected', function (done) {
    const name = 'test_messenger';
    this.timeout(5 * 1000);
    const server = new Server({
      name,
    });
    const messageCount = 3;

    for (let i = 0; i < messageCount; i++) {
      server.broadcast(action, msg);
    }

    const count = 3;

    function getClient() {
      const client = new Client({
        name: name,
      });
      return new Promise(resolve => {
        client.ready(() => {
          resolve(client);
        });
      });
    }

    function getClients() {
      const clients = [];
      for (let i = 0; i < count; i++) {
        clients.push(getClient());
      }
      return clients;
    }

    Promise.all(getClients())
      .then(clients => {
        return Promise.all(
          clients.map(client => {
            return new Promise(resolve => {
              let count = messageCount;
              client.on(action, message => {
                assert(message.name === msg.name);
                count--;
                if (count === 0) {
                  resolve();
                }
              });
            });
          })
        );
      })
      .then(() => {
        done();
      })
      .catch(() => {
        assert(false);
      });
  });

  it('should server handle client callback ok', done => {
    const action = 'callback_test';
    const action1 = 'callback_test1';
    const data = {
      name: 'message_data',
    };
    const client = new Client({
      name: name,
    });

    server.once(action, (message, reply, cli) => {
      cli.send(action1, data, (err, res) => {
        assert(res.name === data.name);
        done();
      });
    });

    client.once(action1, (msg, reply) => {
      reply(msg);
    });

    client.ready(() => {
      client.send(action, data);
    });
  });

  it('should server handle client disconnect ok', done => {
    const client = new Client({
      name: name,
    });

    server.once('disconnected', () => {
      done();
    });

    client.ready(() => {
      client.close();
    });
  });

  it('should a client reconnect server when server restarted', done => {
    const client = new Client({
      name,
    });

    client.on(action, message => {
      assert(message.name === msg.name);
      done();
    });

    function restart() {
      server.broadcast(action, msg);
    }

    client.ready(() => {
      server.server.unref();
      process.nextTick(restart);
    });
  });
});
