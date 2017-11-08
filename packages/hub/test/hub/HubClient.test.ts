import mm = require('mm');
import {expect} from 'chai';
import {Hub} from '../../src/hub/Hub';
import {HubClient} from '../../src/hub/HubClient';
import {EventEmitter} from 'events';
import {PANDORA_HUB_ACTION_MSG_DOWN, PANDORA_HUB_ACTION_MSG_UP} from '../../src/const';

describe('HubClient', () => {

  describe('start and stop', () => {

    let hub: Hub;
    before(async () => {
      hub = new Hub();
      await hub.start();
    });

    after(async () => {
      await hub.stop();
    });

    it('should start() and stop() be ok', async () => {
      const client = new HubClient({
        location: {
          appName: 'testApp'
        }
      });
      await client.start();
      await client.stop();
    });

    it('should throw an error when start twice and stop twice', async () => {
      const client = new HubClient({
        location: {
          appName: 'testApp'
        }
      });
      await client.start();
      await expect(client.start()).to.be.rejectedWith('HubClient already started');
      await client.stop();
      await expect(client.stop()).to.be.rejectedWith('HubClient has not started yet');
    });

  });

  describe('dispatch', () => {

    it('should pushDispatchHandler and handleHubDispatch be ok', async () => {

      const client = new HubClient({
        location: {
          appName: 'testApp'
        }
      });

      client.pushDispatchHandler({
        dispatch(message) {
          if(message.action === 'custom') {
            return {
              test: true
            };
          }
        }
      });


      // case 1 : hit dispatchHandler
      let gotEvent1 = false;
      client.once('custom', () => {
        gotEvent1 = true;

      });
      const res1 = await client.handleHubDispatch({
        action: 'custom'
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(res1.test).to.be.true;
      expect(gotEvent1).to.be.false;


      // case 2 : emit event if not hit dispatchHandler
      let gotEvent2 = false;
      client.once('lala', () => {
        gotEvent2 = true;

      });
      await client.handleHubDispatch({
        action: 'lala'
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(gotEvent2).to.be.true;

    });

    it('should handing PANDORA_HUB_ACTION_ONLINE_UP be ok', async () => {

      const fakeClient = {
        logger: console,
        messengerClient: new EventEmitter,
        startListen: HubClient.prototype.startListen,
        handleHubDispatch: function () {
          return {test: true};
        }
      };

      fakeClient.startListen();
      const res = await <Promise<any>> new Promise((resolve, reject) => {
        fakeClient.messengerClient.emit(PANDORA_HUB_ACTION_MSG_DOWN, {needReply: true}, (resp) => {
          if(!resp.success) {
            return reject(resp.error);
          }
          resolve(resp.data);
        });
      });

      expect(res.test).to.be.true;

    });

    it('should handing PANDORA_HUB_ACTION_ONLINE_UP without reply be ok', async () => {

      let called = false;
      const fakeClient = {
        logger: console,
        messengerClient: new EventEmitter,
        startListen: HubClient.prototype.startListen,
        handleHubDispatch: function () {
          called = true;
          return {test: true};
        }
      };

      fakeClient.startListen();
      fakeClient.messengerClient.emit(PANDORA_HUB_ACTION_MSG_DOWN, {needReply: false}, null);
      expect(called).to.be.true;
    });

    it('should get an error when handing PANDORA_HUB_ACTION_ONLINE_UP got an error from dispatchHandler', async () => {

      const fakeClient = {
        logger: console,
        messengerClient: new EventEmitter,
        startListen: HubClient.prototype.startListen,
        handleHubDispatch: function () {
          throw new Error('fake error');
        }
      };

      fakeClient.startListen();
      expect(new Promise((resolve, reject) => {
        fakeClient.messengerClient.emit(PANDORA_HUB_ACTION_MSG_DOWN, {needReply: true}, (resp) => {
          if(!resp.success) {
            return reject(resp.error);
          }
          resolve(resp.data);
        });
      })).to.be.rejectedWith('fake error');

    });

    it('should log error when handing PANDORA_HUB_ACTION_ONLINE_UP got an error from unknown place', async () => {

      const errorLogs = [];
      const fakeClient = {
        logger: {
          error: function (msg) {
            errorLogs.push(msg);
          }
        },
        messengerClient: new EventEmitter,
        startListen: HubClient.prototype.startListen,
        handleHubDispatch: function () {
          return {test: true};
        }
      };

      fakeClient.startListen();
      await new Promise((resolve) => {
        fakeClient.messengerClient.emit(PANDORA_HUB_ACTION_MSG_DOWN, {needReply: true}, () => {
          resolve();
          throw new Error('fake error');
        });
      });

      expect(errorLogs.length).to.be.equal(2);
      expect(errorLogs[0].toString()).to.be.includes('fake error');
      expect(errorLogs[1]).to.be.includes('Handing PANDORA_HUB_ACTION_MSG_DOWN went wrong');

    });

  });

  describe('publish and unpulibsh', () => {

    const hubClient: HubClient = new HubClient({
      location: {
        appName: 'fake'
      }
    });

    it('should publish be ok', async () => {
      let calledSendPublishToHub = false;
      mm(hubClient, 'sendPublishToHub', () => {
        calledSendPublishToHub = true;
      });
      await hubClient.publish({
        appName: 'fake',
        objectName: 'theName'
      });
      expect(calledSendPublishToHub).to.be.true;
      expect((<any> hubClient).publishedSelectors.length).to.be.equal(1);
      mm.restore();
    });

    it('should get an error when publish same one again', async () => {
      await expect(hubClient.publish({
        appName: 'fake',
        objectName: 'theName'
      })).to.be.rejectedWith('already exist');
    });

    it('should unpublish be ok', async () => {
      let calledSendToHubAndWaitReply = false;
      mm(hubClient, 'sendPublishToHub', () => {
      });
      mm(hubClient, 'sendToHubAndWaitReply', () => {
        calledSendToHubAndWaitReply = true;
        return {
          success: true
        };
      });
      await hubClient.publish({
        appName: 'fake',
        objectName: 'theName2'
      });
      await hubClient.unpublish({
        appName: 'fake',
        objectName: 'theName'
      });
      expect(calledSendToHubAndWaitReply).to.be.true;
      expect((<any> hubClient).publishedSelectors.length).to.be.equal(1);
      await hubClient.unpublish({
        appName: 'fake',
        objectName: 'theName2'
      });
      expect((<any> hubClient).publishedSelectors.length).to.be.equal(0);
      mm.restore();
    });

    it('should get an error when unpublish() got an error from Hub', async () => {

      mm(hubClient, 'sendPublishToHub', () => {
      });
      mm(hubClient, 'sendToHubAndWaitReply', () => {
        return {
          success: false,
          error: new Error('fake error')
        };
      });

      await hubClient.publish({
        appName: 'fake',
        objectName: 'theName'
      });
      await expect(hubClient.unpublish({
        appName: 'fake',
        objectName: 'theName'
      })).to.be.rejectedWith('fake error');

      mm.restore();

    });

    it('should get an error when sendPublishToHub() got an error from Hub', async () => {

      const fakeHubClient = {
        sendPublishToHub: (<any> HubClient.prototype).sendPublishToHub,
        sendToHubAndWaitReply: function () {
          return {
            success: false,
            error: new Error('fake error')
          };
        }
      };
      await expect(fakeHubClient.sendPublishToHub({
        appName: 'fakeApp'
      })).to.be.rejectedWith('fake error');

    });


  });

  describe('send and multipleSend', () => {

    it('should send() be ok', async () => {

      let msg = null;
      let action = null;
      const fakeHubClient = {
        send: HubClient.prototype.send,
        sendToHub: function (ownAction, ownMsg) {
          msg = ownMsg;
          action = ownAction;
        }
      };

      fakeHubClient.send({objectName: 'nope'}, 'anAction', {
        test: true
      });

      expect(action).to.be.equal(PANDORA_HUB_ACTION_MSG_UP);
      expect(msg.broadcast).to.be.false;
      expect(msg.remote).to.deep.equal({
        objectName: 'nope'
      });

    });

    it('should multipleSend() be ok', async () => {

      let msg = null;
      let action = null;
      const fakeHubClient = {
        multipleSend: HubClient.prototype.multipleSend,
        sendToHub: function (ownAction, ownMsg) {
          msg = ownMsg;
          action = ownAction;
        }
      };

      fakeHubClient.multipleSend({objectName: 'nope'}, 'anAction', {
        test: true
      });

      expect(action).to.be.equal(PANDORA_HUB_ACTION_MSG_UP);
      expect(msg.broadcast).to.be.true;
      expect(msg.remote).to.deep.equal({
        objectName: 'nope'
      });

    });

    it('should sendToHub() be ok', async () => {

      let msg = null;
      let action = null;
      const fakeHubClient = {
        location: { appName: 'fake' },
        messengerClient: {
          send: function (ownAction, ownMsg) {
            action = ownAction;
            msg = ownMsg;
          }
        },
        sendToHub: (<any> HubClient.prototype).sendToHub
      };
      fakeHubClient.sendToHub('anAction');
      expect(action).to.deep.equal('anAction');
      expect(msg.host).to.deep.equal(fakeHubClient.location);

    });

  });

  describe('invoke and multipleInvoke', () => {

    it('should invoke() be ok', async () => {

      let msg = null;
      let action = null;
      const fakeHubClient = {
        location: { appName: 'fake' },
        invoke: HubClient.prototype.invoke,
        sendToHubAndWaitReply: (ownAction, ownMsg) => {
          msg = ownMsg;
          action = ownAction;
          return {
            success: true
          };
        }
      };

      const res = await fakeHubClient.invoke({objectName: 'nope'}, 'anAction', { test: true });
      expect(res.success).to.be.true;

      expect(action).to.deep.equal(PANDORA_HUB_ACTION_MSG_UP);
      expect(msg.broadcast).to.be.false;
      expect(msg.remote).to.deep.equal({
        objectName: 'nope'
      });

    });

    it('should multipleInvoke() be ok', async () => {

      let msg = null;
      let action = null;
      const fakeHubClient = {
        location: { appName: 'fake' },
        multipleInvoke: HubClient.prototype.multipleInvoke,
        sendToHubAndWaitReply: (ownAction, ownMsg) => {
          msg = ownMsg;
          action = ownAction;
          return {
            batchReply: [
              {
                success: true
              }
            ]
          };
        }
      };

      const res = await fakeHubClient.multipleInvoke({objectName: 'nope'}, 'anAction', { test: true });

      expect(res[0].success).to.be.true;
      expect(action).to.deep.equal(PANDORA_HUB_ACTION_MSG_UP);
      expect(msg.broadcast).to.be.true;
      expect(msg.remote).to.deep.equal({
        objectName: 'nope'
      });

    });

    it('should get an error when sendToHubAndWaitReply() got an error from Hub', async () => {

      const fakeHubClient = {
        sendToHubAndWaitReply: (<any> HubClient.prototype).sendToHubAndWaitReply,
        messengerClient: {
          send (action, message, reply) {
            reply(new Error('fake error'));
          }
        }
      };

      await expect(fakeHubClient.sendToHubAndWaitReply('anAction', {test: true})).to.be.rejectedWith('fake error');

    });

  });

});
