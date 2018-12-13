'use strict';
import Base = require('sdk-base');
import assert = require('assert');
import eventName from './eventName';
import * as os from 'os';
import * as path from 'path';
const tmpDir = process.env.PANDORA_TMP_DIR || os.tmpdir();
const sockPath = Symbol('sockpath');

class MessengerBase extends Base {
  options: any;
  protected _messageEvent: any;

  constructor(options) {
    super();
    if (!options.socket) {
      assert(options.name, `options.name is required!`);
    }
    this.options = options;
    this.on(eventName, (message, reply, client) => {
      if (message && typeof message.action === 'string') {
        this.emit(message.action, message.data, reply, client);
      }
    });
  }

  _throwError(error) {
    this.emit('error', error);
  }

  defaultErrorHandler(err) {
    // pass
  }

  get sockPath() {
    if (!this[sockPath]) {
      let sock = path.join(tmpDir, `pandorajs_${this.options.name.replace(/[^\w]/g, '')}.sock`);
      if (process.platform === 'win32') {
        sock = '\\\\.\\pipe\\' + sock.replace(/^\//, '').replace(/\//g, '-');
      }
      this[sockPath] = sock;
    }
    return this[sockPath];
  }
}

export default MessengerBase;
