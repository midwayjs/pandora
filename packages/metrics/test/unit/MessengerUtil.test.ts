import {MetricsMessengerServer, MetricsMessengerClient} from '../../src/util/MessengerUtil';
import {MessengerClient, MessengerServer} from 'pandora-messenger';
import {expect} from 'chai';

describe('/test/unit/MessengerUtil.test.ts', () => {

  const KEY_NAME = 'ZHANGTING';
  let server = new MetricsMessengerServer(KEY_NAME);
  let client = new MetricsMessengerClient(KEY_NAME);

  it('instanceof MetricsMessenge', () => {
    expect(server).to.be.an.instanceof(MetricsMessengerServer);
    expect(client).to.be.an.instanceof(MetricsMessengerClient);
  });

  it('instanceof Messenger', () => {
    expect(server.server).to.be.an.instanceof(MessengerServer);
    expect(client.client).to.be.an.instanceof(MessengerClient);
  });

  describe('test discover client', () => {

    const CLIENT_KEY_NAME = 'CLIENT:TEST';
    const CLIENT_KEY_NAME_TIMEOUT = 'CLIENT:TEST:TIMEOUT';
    let reply, clientProxy;

    server.discovery((data, replyCallback, replyClient: MessengerClient) => {
      reply(data, replyClient, replyCallback);
    });

    it('register new client', (done) => {

      reply = (data, replyClient, replyCallback) => {
        clientProxy = replyClient;
        expect(data.text).to.equal('hello');
        replyCallback('zhangting');
        done();
      };

      client.register({
        text: 'hello'
      }, (err, callbackData) => {
        expect(callbackData).to.equal('zhangting');
      });
    });

    it('connnect client direct', (done) => {

      client.query(CLIENT_KEY_NAME, (data, callback) => {
        expect(data.text).to.equal('welcome');
        callback({
          text: 'ok',
        });
      });

      clientProxy.send(CLIENT_KEY_NAME, {
        text: 'welcome',
      }, (err, data) => {
        expect(data.text).to.equal('ok');
        done();
      });
    });


    it('connnect client timeout', (done) => {
      clientProxy.send(CLIENT_KEY_NAME_TIMEOUT, {
        text: 'welcome',
      }, (err, data) => {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.name).to.equal('MessengerRequestTimeoutError');
        done();
      }, 100);
    });

  });
});
