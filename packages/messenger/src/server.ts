'use strict';
const debug = require('debug')('pandora:messenger:server');
const is: any = require('is-type-of');
import * as net from 'net';
import * as fs from 'fs';
import MessengerBase from './base';
import Client from './client';
import eventName from './eventName';

export default class Server extends MessengerBase {
  private clients: Map<any, any>;
  server: net.Server;
  pending: Array<any>;

  constructor(options) {
    super(options);
    this.clients = new Map();
    this.server = net.createServer(this._handleConnection.bind(this));
    this.server.on('error', this._throwError.bind(this));
    this.listen();
  }

  listen(callback?) {
    const sockPath = this.sockPath;
    if (fs.existsSync(sockPath)) {
      fs.unlinkSync(sockPath);
    }
    this.server.listen(sockPath, () => {
      debug(`[server] pandora messenger server is listening, socket path is ${this.sockPath}!`);
      setImmediate(() => {
        this.ready(true);
        if (is.function(callback)) {
          callback();
        }
      });
    });
    return this;
  }

  broadcast(action, data) {
    return this._broadcast({
      action: action,
      data: data,
    });
  }

  _broadcast(info) {
    if (this.clients.size === 0) {
      if (!this.pending) {
        this.pending = [];
        this.on('connected', (client) => {
          this.pending.forEach((msg) => {
            client.send(msg.action, msg.data);
          });
        });
      }
      this.pending.push(info);
      return this;
    }
    for (const sock of this.clients.keys()) {
      this.clients.get(sock).send(info.action, info.data);
    }
    return this;
  }

  close(callback) {
    for (const sock of this.clients.keys()) {
      const client = this.clients.get(sock);
      client.close();
      this.clients.delete(sock);
    }
    this.server.close(callback);
    this.server.removeAllListeners();
    return this;
  }

  _handleMessage(message, reply, client) {
    this.emit(eventName, message, reply, client);
  }

  _handleDisconnect(socket) {
    debug(`[server] server lost a connection!`);
    this.clients.delete(socket);
    this.emit('disconnected');
  }

  _handleConnection(socket) {
    debug(`[server] server got a connection!`);
    const client = new Client({
      socket: socket,
      name: this.options.name,
    });
    this.clients.set(socket, client);
    client.on(eventName, (message, reply) => {
      this._handleMessage(message, reply, client);
    });
    client.on('error', this._throwError.bind(this));
    socket.on('close', this._handleDisconnect.bind(this, socket));
    this.emit('connected', client);
  }
}

