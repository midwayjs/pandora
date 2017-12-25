/// <reference path="../d.ts/sdk-base.d.ts" />
'use strict';
import MessengerClient from './client';
import MessengerServer from './server';
import assert = require('assert');
import eventName from './eventName';

const Clients = new Map();
const Servers = new Map();

function factory(options, type) {
  assert(options.name, 'options.name is required');
  const isClient = type === 'client';
  const MessengerClass = isClient ? MessengerClient : MessengerServer;
  const key = options.name;
  const pool =  isClient ? Clients : Servers;
  if (!pool[key]) {
    pool[key] = new MessengerClass(options);
  }
  return pool[key];
}


export {default as MessengerClient} from './client';
export {default as MessengerServer} from './server';

export default {
  eventName,
  Client: MessengerClient,
  Server: MessengerServer,
  getClient(options): MessengerClient {
    options = Object.assign({reConnectTimes: 10}, options);
    return factory(options, 'client');
  },

  getServer(options) {
    return factory(options, 'server');
  }
};
