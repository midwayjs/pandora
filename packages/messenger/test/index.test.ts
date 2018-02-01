'use strict';
import messenger from '../src';
const messengerName = 'messenger_test';
const assert = require('assert');

describe('test/index.test.js', () => {
    let server, client;
    const options = {
        name: messengerName,
        reConnectTimes: 0,
    };

    before(function(done) {
        server = messenger.getServer(options);
        server.ready(() => {
            client = messenger.getClient(options);
            client.ready(done);
        });
    });

    after(function () {
        client.close();
        server.close();
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

    it('should client send message and callback ok', function(done) {
        const msg = {
            'name': 'midway'
        };

        const action = 'test';

        function onMessage(message, reply) {
            assert(message.name === msg.name);
            reply({
                name: 'reply_message'
            });
        }
        server.once(action, onMessage);
        client.send(action, msg, (err, res) => {
            assert(res.name === 'reply_message');
            done();
        });
    });
});
