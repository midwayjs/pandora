import {expect} from 'chai';
import {Hub} from '../../src/hub/Hub';
import {MessagePackage, Selector} from '../../src/domain';
import {PANDORA_HUB_ACTION_MSG_DOWN} from '../../src/const';
import {RouteTable} from '../../src/hub/RouteTable';

describe('Hub', function () {

  describe('basic', () => {

    class TestHub extends Hub {
      getMessengerServer() {
        return this.messengerServer;
      }
    }

    it('should start() and stop() be ok', async () => {
      const hub = new TestHub();
      await hub.start();
      const msgServer = hub.getMessengerServer();
      expect(msgServer).to.be.ok;
      expect((<any> msgServer.server).listening).to.be.equal(true);
      await hub.stop();
      expect((<any> msgServer.server).listening).to.be.equal(false);
    });

  });

  describe('dispatch', () => {

    class TestHub extends Hub {
      public selectClientsCalled = [];

      constructor(options?) {
        super();
        options = options || {};
        const hub = this;
        this.routeTable = <RouteTable> <any> {
          selectClients(selector) {
            hub.selectClientsCalled.push(selector);
            if (options.selectClients) {
              return options.selectClients(selector);
            }
          }
        };
      }
    }

    it('should broadcast to all clients be ok', async () => {

      const hub = new TestHub();
      await hub.start();

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
          test: 'Call me GuangWong, i am an engineer from Alibaba.'
        }
      };

      await new Promise((resolve, reject) => {
        hub.handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      });

      expect(hub.selectClientsCalled.length).to.be.equal(0);
      await hub.stop();

    });

    it('should broadcast to selector selected clients be ok', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send(action: string, message: MessagePackage, reply) {
          expect(action).to.equal(PANDORA_HUB_ACTION_MSG_DOWN);
          expect(message.remote.appName).to.be.ok;
          expect(message.remote.processName).to.be.ok;
          expect(message.remote.serviceName).to.be.ok;
          expect(message.data.test).to.be.ok;
          sendCalledTimes++;
          if (message.needReply) {
            reply(null, {
              success: true
            });
          }
        }
      };


      const hub = new TestHub({
        selectClients: (selector: Selector) => {
          expect(selector.appName).to.be.ok;
          expect(selector.processName).to.be.ok;
          expect(selector.serviceName).to.be.ok;
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

      await hub.start();

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
          serviceName: 'dfsdf.sdf'
        },
        data: {
          test: 'Call me GuangWong, i am an engineer from Alibaba.'
        }
      };

      await new Promise((resolve, reject) => {
        hub.handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve(resp);
          } else {
            reject(resp.error);
          }
        });
      });

      expect(sendCalledTimes).to.be.equal(4);

      await hub.stop();

    });

    it('should send the message to a random one of all selector selected clients be ok', async () => {

      let sendCalledTimes = 0;
      const shimClient = {
        send(action: string, message: MessagePackage, reply) {
          expect(action).to.equal(PANDORA_HUB_ACTION_MSG_DOWN);
          expect(message.remote.appName).to.be.ok;
          expect(message.remote.processName).to.be.ok;
          expect(message.remote.serviceName).to.be.ok;
          expect(message.data.test).to.be.ok;
          sendCalledTimes++;
          if (message.needReply) {
            reply(null, {
              success: true
            });
          }
        }
      };

      const hub = new TestHub({
        selectClients: (selector: Selector) => {
          expect(selector.appName).to.be.ok;
          expect(selector.processName).to.be.ok;
          expect(selector.serviceName).to.be.ok;
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
          appName: 'remoteAppName',
          processName: 'aname',
          serviceName: 'dfsdf.sdf'
        },
        data: {
          test: 'Call me GuangWong, i am an engineer from Alibaba.'
        }
      };

      await new Promise((resolve, reject) => {
        hub.handleMessageIn(messagePackage, (resp) => {
          if (resp.success) {
            resolve();
          } else {
            reject(resp.error);
          }
        });
      });

      // Make sure the client.send() only called once
      expect(sendCalledTimes).to.be.equal(1);

      await hub.stop();

    });

  });

});