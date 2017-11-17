import {expect} from 'chai';
import {Hub} from '../../src/hub/Hub';
import {MessagePackage, Selector} from '../../src/domain';
import {
  PANDORA_HUB_ACTION_MSG_DOWN, PANDORA_HUB_ACTION_OFFLINE_UP,
  PANDORA_HUB_ACTION_ONLINE_UP, PANDORA_HUB_ACTION_PUBLISH_UP, PANDORA_HUB_ACTION_UNPUBLISH_UP
} from '../../src/const';
import mm = require('mm');
import {EventEmitter} from 'events';

describe('Hub', function () {

  describe('start and stop', () => {

    it('should start() and stop() be ok', async () => {
      const hub = new Hub();
      await hub.start();
      const msgServer = (<any> hub).messengerServer;
      expect(msgServer).to.be.ok;
      expect((<any> msgServer.server).listening).to.be.equal(true);
      await hub.stop();
      expect((<any> msgServer.server).listening).to.be.equal(false);
    });

    it('should throw an error when start twice and stop twice', async () => {
      const hub = new Hub();
      await hub.start();
      await expect(hub.start()).to.be.rejectedWith('Hub already started');
      await hub.stop();
      await expect(hub.stop()).to.be.rejectedWith('Hub has not started yet');
    });

    it('should get an error when messengerServer.close() get an error', async () => {
      const hub = new Hub();
      await hub.start();
      await new Promise(resolve => (<any> hub).messengerServer.close(resolve));
      await expect(hub.stop()).to.be.rejectedWith('Not running');
    });

  });

  describe('dispatch', () => {

    // broadcast to all clients

    it('should broadcast to all clients be ok', async () => {

      const hub = new Hub();
      await hub.start();

      let selectClientsCalled = false;
      let broadcastCalled = false;

      mm(hub, 'routeTable', {
        selectClients() {
          selectClientsCalled = true;
        }
      });

      mm(hub, 'messengerServer', {
        broadcast(action, message) {
          expect(action).to.be.equal(PANDORA_HUB_ACTION_MSG_DOWN);
          expect(message.data.test).to.be.ok;
          broadcastCalled = true;
        }
      });

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: null,
        data: {
          test: 'fakeMsg'
        }
      };

      await new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      });

      expect(selectClientsCalled).to.be.false;
      expect(broadcastCalled).to.be.true;

      mm.restore();
      await hub.stop();

    });

    it('should get an error when broadcast to all clients thrown an error', async () => {

      const hub = new Hub();
      await hub.start();

      mm(hub, 'messengerServer', {
        broadcast() {
          throw new Error('a fake error');
        }
      });

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: null,
        data: null
      };

      await expect(new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      })).to.be.rejectedWith('a fake error');

      mm.restore();
      await hub.stop();

    });

    it('should ignore error when broadcast to all clients without reply', async () => {

      const hub = new Hub();
      await hub.start();

      const messagePackage: MessagePackage = {
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: null,
        data: null
      };

      mm(hub, 'messengerServer', {
        broadcast() {
          throw new Error('a fake error');
        }
      });
      (<any> hub).handleMessageIn(messagePackage);
      mm.restore();

      await hub.stop();

    });

    it('should broadcast to all clients without reply', async () => {

      const hub = new Hub();
      await hub.start();

      const messagePackage: MessagePackage = {
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: null,
        data: null
      };
      let calledBroadcast = false;
      mm(hub, 'messengerServer', {
        broadcast() {
          calledBroadcast = true;
        }
      });
      (<any> hub).handleMessageIn(messagePackage);

      expect(calledBroadcast).to.be.true;

      mm.restore();
      await hub.stop();

    });

    // broadcast to all selected clients

    it('should broadcast to all selected clients', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send(action: string, message: MessagePackage, reply) {
          expect(action).to.equal(PANDORA_HUB_ACTION_MSG_DOWN);
          expect(message.remote.appName).to.be.ok;
          expect(message.remote.processName).to.be.ok;
          expect(message.remote.objectName).to.be.ok;
          expect(message.data.test).to.be.ok;
          sendCalledTimes++;
          if (message.needReply) {
            reply(null, {
              success: true
            });
          }
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          expect(selector.appName).to.be.ok;
          expect(selector.processName).to.be.ok;
          expect(selector.objectName).to.be.ok;
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };

      await new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve(resp);
          } else {
            reject(resp.error);
          }
        });
      });

      expect(sendCalledTimes).to.be.equal(4);

      mm.restore();
      await hub.stop();

    });

    it('should get an error when broadcast to all selected clients thrown an error', async () => {

      const shimClient = {
        send(action, message, callback) {
          callback(new Error('fake error'));
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };

      const {batchReply} = await <Promise<any>> new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve(resp);
          } else {
            reject(resp.error);
          }
        });
      });

      expect(batchReply.length).to.be.equal(4);

      for(const reply of batchReply) {
        expect(reply.error.toString()).to.be.include('fake error');
      }

      mm.restore();
      await hub.stop();

    });

    it('should broadcast to all selected clients without reply', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send() {
          sendCalledTimes++;
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });

      const messagePackage: MessagePackage = {
        broadcast: true,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };
      (<any> hub).handleMessageIn(messagePackage);
      expect(sendCalledTimes).to.be.equal(4);

      mm.restore();
      await hub.stop();

    });

    // balance to a random one of all selected clients

    it('should balance to a random one of all selected clients', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send(action: string, message: MessagePackage, reply) {
          expect(action).to.equal(PANDORA_HUB_ACTION_MSG_DOWN);
          expect(message.remote.appName).to.be.ok;
          expect(message.remote.processName).to.be.ok;
          expect(message.remote.objectName).to.be.ok;
          expect(message.data.test).to.be.ok;
          sendCalledTimes++;
          if (message.needReply) {
            reply(null, {
              success: true
            });
          }
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          expect(selector.appName).to.be.ok;
          expect(selector.processName).to.be.ok;
          expect(selector.objectName).to.be.ok;
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });


      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: false,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };

      await new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      });

      // Make sure the client.send() only called once
      expect(sendCalledTimes).to.be.equal(1);

      mm.restore();
      await hub.stop();

    });

    it('should get an error when broadcast to a random one of all selected clients thrown an error', async () => {

      const shimClient = {
        send(action, message, callback) {
          callback(new Error('fake error'));
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: false,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };

      await expect(new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve(resp);
          } else {
            reject(resp.error);
          }
        });
      })).to.be.rejectedWith('fake error');

      mm.restore();
      await hub.stop();

    });

    it('should balance to a random one of all selected clients without reply', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send() {
          sendCalledTimes++;
        }
      };

      const hub = new Hub();
      await hub.start();

      mm(hub, 'routeTable', {
        selectClients: (selector: Selector) => {
          const shimSelectedInfo = {
            client: shimClient,
            selector: selector
          };
          return [
            shimSelectedInfo, shimSelectedInfo,
            shimSelectedInfo, shimSelectedInfo
          ];
        }
      });

      const messagePackage: MessagePackage = {
        broadcast: false,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'remoteAppName',
          processName: 'aname',
          objectName: 'fake.name'
        },
        data: {
          test: 'fakeMsg'
        }
      };
      (<any> hub).handleMessageIn(messagePackage);
      expect(sendCalledTimes).to.be.equal(1);

      mm.restore();
      await hub.stop();

    });


    // non-existent selector

    it('should get an error when looking for an non-existent selector', async () => {

      const hub = new Hub();
      await hub.start();

      const messagePackage: MessagePackage = {
        needReply: true,
        broadcast: false,
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'unkown',
          processName: 'unkown',
          objectName: 'unkown'
        },
        data: null
      };

      await expect(new Promise((resolve, reject) => {
        (<any> hub).handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      })).to.be.rejectedWith('Cannot found any clients by selector');

    });

    it('should ignore error when looking for an non-existent selector and without reply', async () => {

      const hub = new Hub();
      await hub.start();

      const messagePackage: MessagePackage = {
        host: {
          appName: 'justTest',
          processName: 'nobody',
          pid: null
        },
        remote: {
          appName: 'unknown',
          processName: 'unknown',
          objectName: 'unknown'
        },
        data: null
      };

      (<any> hub).handleMessageIn(messagePackage);
      mm.restore();
      await hub.stop();

    });

  });

  describe('routeTable related messages', () => {

    it('should add initialization relation for client when that client connected', () => {

      const client = {};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          setRelation (client, selector) {
            expect(client).to.be.equal(client);
            expect(selector).to.deep.equal({initialization: true});

          }
        }
      };
      fakeHub.startListen();
      fakeHub.messengerServer.emit('connected', client);

    });

    it('should forgetClient when a client disconnected', () => {

      const client = {};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          forgetClient (client) {
            expect(client).to.be.equal(client);

          }
        }
      };
      fakeHub.startListen();
      fakeHub.messengerServer.emit('disconnected', client);

    });

    it('should setRelation when got a PANDORA_HUB_ACTION_ONLINE_UP message', async () => {

      const client = {};
      const selector = {appName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          setRelation (client, ownSelector) {
            expect(client).to.be.equal(client);
            expect(ownSelector).to.deep.equal(selector);
          }
        }
      };
      fakeHub.startListen();

      await new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_ONLINE_UP, {
          host: selector
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      });

    });

    it('should get an error when handing PANDORA_HUB_ACTION_ONLINE_UP message got an error', async () => {

      const client = {};
      const selector = {appName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          setRelation (client) {
            throw new Error('fake error');
          }
        }
      };
      fakeHub.startListen();

      await expect(new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_ONLINE_UP, {
          host: selector
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      })).to.be.rejectedWith('fake error');

    });

    it('should forgetClient when got a PANDORA_HUB_ACTION_OFFLINE_UP message', async () => {

      const client = {};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          forgetClient (client) {
            expect(client).to.be.equal(client);
          }
        }
      };
      fakeHub.startListen();

      await new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_OFFLINE_UP, {
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      });

    });

    it('should get an error when handing PANDORA_HUB_ACTION_OFFLINE_UP message got an error', async () => {

      const client = {};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          forgetClient () {
            throw new Error('fake error');
          }
        }
      };
      fakeHub.startListen();

      await expect(new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_OFFLINE_UP, {
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      })).to.be.rejectedWith('fake error');

    });

    it('should setRelation when got a PANDORA_HUB_ACTION_PUBLISH_UP message', async () => {

      const client = {};
      const selector = {objectName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          setRelation (client, ownSelector) {
            expect(client).to.be.equal(client);
            expect(ownSelector).to.be.equal(selector);
          }
        }
      };
      fakeHub.startListen();

      await new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_PUBLISH_UP, {
          data: {selector}
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      });

    });

    it('should get an error when handing PANDORA_HUB_ACTION_PUBLISH_UP message got an error', async () => {

      const client = {};
      const selector = {objectName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          setRelation () {
            throw new Error('fake error');
          }
        }
      };
      fakeHub.startListen();

      await expect(new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_PUBLISH_UP, {
          data: {selector}
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      })).to.be.rejectedWith('fake error');

    });


    it('should setRelation when got a PANDORA_HUB_ACTION_UNPUBLISH_UP message', async () => {

      const client = {};
      const selector = {objectName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          forgetRelation (client, ownSelector) {
            expect(client).to.be.equal(client);
            expect(ownSelector).to.be.equal(selector);
          }
        }
      };
      fakeHub.startListen();

      await new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_UNPUBLISH_UP, {
          data: {selector}
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      });

    });

    it('should get an error when handing PANDORA_HUB_ACTION_UNPUBLISH_UP message got an error', async () => {

      const client = {};
      const selector = {objectName: Date.now().toString()};

      const fakeHub = {
        handleMessageIn: function () {},
        messengerServer: new EventEmitter(),
        startListen: (<any> Hub.prototype).startListen,
        routeTable: {
          forgetRelation () {
            throw new Error('fake error');
          }
        }
      };
      fakeHub.startListen();

      await expect(new Promise((resolve, reject) => {
        fakeHub.messengerServer.emit(PANDORA_HUB_ACTION_UNPUBLISH_UP, {
          data: {selector}
        }, (resp) => {
          if(resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        }, client);
      })).to.be.rejectedWith('fake error');

    });

  });

});