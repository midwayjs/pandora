'use strict';
const uncaughtException = require('uncaughtException');
const pedding = require('pedding');
const should = require('should');
import messenger from '../src';
const assert = require('assert');
const Client = messenger.Client;
const Server = messenger.Server;

describe('test/client.test.js', () => {

    const name = 'messenger_test';
    const msg = {
        name,
    };
    const action = 'midway-messenger-action';

    let client, server;

    before(function(done) {
        server = new Server({
            name,
        });

        server.ready(() => {
            client = new Client({
                name,
            });
            client.ready(done);
        });
    });


    after(() => {
        client.close();
        server.close();
    });


    it('client should be ok', () => {
        client.isOK.should.be.ok;
    });

    it('should client send message ok', function(done) {
        const msg = {
            'name': 'midway'
        };

        const action = 'test';

        function onMessage(message) {
            assert(message.name === msg.name);
            done();
        }
        server.once(action, onMessage);
        client.send(action, msg);
    });

    it('should client send message and receive callback ok', function(done) {
        const msg = {
            'name': 'midway'
        };

        const action = 'test';

        function onMessage(message, reply) {
            assert(message.name === msg.name);
            reply(msg);
        }
        server.once(action, onMessage);
        client.send(action, msg, (err, res) => {
            assert(res.name === msg.name);
            done();
        });
    });

    it('should client send message and receive timeout ok', function(done) {
        const msg = {
            'name': 'midway'
        };

        const action = 'test';

        function onMessage(message, reply) {
            assert(message.name === msg.name);
        }

        server.once(action, onMessage);
        client.send(action, msg, (err, res) => {
            assert(err.name === 'MessengerRequestTimeoutError');
            done();
        }, 100);
    });

    it('should emit error if connect error', done => {
        let client = new Client({
            name: 'taojie',
        });
        client.on('error', err => {
            should.exist(err);
            done();
        });
    });

    it('should emit close in the same tick', function(done) {
        let client = new Client({
            name,
        });

        const msg = {
            name,
        };
        const action = 'test';

        client.on('close', () => {
            client = new Client({
                name,
            });
        });

        client.close();

        function onMessage(message) {
            assert(message.name === msg.name);
            done();
        }
        server.once(action, onMessage);

        client.send(action, msg);
    });

    it('should reconnect after socket was closed and invoke ok', done => {
        let client = new Client({
            name,
            reConnectTimes: 1,
        });

        const msg = {
            name,
        };
        const action = 'test';

        function onMessage(message) {
            assert(message.name === msg.name);
            done();
        }
        server.once(action, onMessage);

        client.ready(() => {
          client._close();
          client.send(action, msg);
        });

    });

    it('should reconnect after packet parsed error and invoke ok', done => {
        const client = new Client({
            name,
            reConnectTimes: 5,
        });

        const decode = client.decode;
        client.decode = function() {
            throw  new Error('decode');
        };

        client.once('error', (err) => {
            client.decode = decode.bind(client);
            server.once(action, function(message) {
                assert(message.name === msg.name);
                done();
            });

            client.send(action, msg);
        });

        client.ready(() => {
            server.broadcast(action, msg);
        });
    });

    it('should reconnect and emit error if still can\'t connect / 1', done => {
        done = pedding(2, done);
        const client = new Client({
            name: 'taojie',
            reConnectTimes: 2,
        });

        client.on('error', (err) => {
            done();
        });

        client.on('close', () => {
            done();
        });
    });

  it('should reconnect and emit error if still can\'t connect / 2', done => {
    done = pedding(4, done);
    const client = new Client({
      name: 'taojie',
      reConnectTimes: 2,
      reConnectAtFirstTime: true
    });

    client.on('error', (err) => {
      done();
    });

    client.on('close', () => {
      done();
    });
  });

    it('should emit error if parse header error', done => {
        let client = new Client({
            name,
        });

        client.getHeader = () => {
            throw new Error('header');
        };

        client.on('error', err => {
            should.exist(err);
            err.name.should.eql('PacketParsedError');
            done();
        });

        client.ready(() => {
            server.broadcast(action, msg);
        });
    });

    it('should emit error if parse body error', done => {

        let client = new Client({
            name,
        });

        client.getBodyLength = () => {
            throw new Error('body');
        };

        client.on('error', err => {
            should.exist(err);
            err.name.should.eql('PacketParsedError');
            done();
        });

        client.ready(() => {
            server.broadcast(action, msg);
        });
    });

    it('should send before ready', done => {
        let client = new Client({
            name: name,
        });
        server.once(action, (message) => {
            done();
        });

        client.send(action, msg);
    });

    it('should not emit PacketParsedError  if message is handled with error in event listener', done => {
        uncaughtException(err => {
            assert(err.message === 'message event error');
            done();
        });

        client.once(action, (data) => {
            throw new Error('message event error');
        });

        client.once('error', (err) => {
            assert(false, 'should not run');
        });

        server.broadcast(action, msg);
    });


});
