
// Copy from luin/ioredis test

import * as net from 'net';
import * as utils from 'ioredis/lib/utils';
import * as EventEmitter from 'events';
import * as enableDestroy from 'server-destroy';
import * as Parser from 'redis-parser';

export class FakeRedisServer extends EventEmitter {

  static REDIS_OK = '+OK';

  port = null;
  handler = null;
  socket = null;
  clients = [];

  constructor(port, handler) {
    super();

    this.port = port;
    this.handler = handler;

    this.connect();
  }

  connect() {

    this.socket = net.createServer((c) => {
      const clientIndex = this.clients.push(c) - 1;

      process.nextTick(() => {
        this.emit('connect', c);
      });

      const parser = new Parser({
        returnBuffers: true,
        returnReply: (reply) => {
          reply = utils.convertBufferToString(reply);
          this.write(c, this.handler && this.handler(reply));
        },
        returnError: () => {}
      });

      c.on('end', () => {
        this.clients[clientIndex] = null;
        this.emit('disconnect', c);
      });

      c.on('data', (data) => {
        parser.execute(data);
      });

    });

    this.socket.listen(this.port);
    enableDestroy(this.socket);
  }

  disconnect(callback) {
    this.socket.destroy(callback);
  }

  broadcast(data) {
    for (let i = 0; i < this.clients.length; ++i) {
      if (this.clients[i]) {
        this.write(this.clients[i], data);
      }
    }
  }

  write(c, data) {
    if (c.writable) {
      c.write(convert('', data));
    }

    function convert(str, data) {
      let result;
      if (typeof data === 'undefined') {
        data = FakeRedisServer.REDIS_OK;
      }
      if (data === FakeRedisServer.REDIS_OK) {
        result = '+OK\r\n';
      } else if (data instanceof Error) {
        result = '-' + data.message + '\r\n';
      } else if (Array.isArray(data)) {
        result = '*' + data.length + '\r\n';
        data.forEach(function (item) {
          result += convert(str, item);
        });
      } else if (typeof data === 'number') {
        result = ':' + data + '\r\n';
      } else if (data === null) {
        result = '$-1\r\n';
      } else {
        data = data.toString();
        result = '$' + data.length + '\r\n';
        result += data + '\r\n';
      }
      return str + result;
    }
  }
}