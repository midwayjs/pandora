import {EventEmitter} from 'events';
import {ErrorLogManager} from 'pandora-component-error-log';
const debug = require('debug')('pandora:reporter-manager:ErrorLogOscillator');

export interface ErrorLogOscillatorOption {
}

export class ErrorLogOscillator extends EventEmitter {

  options;
  errorLogManager: ErrorLogManager;
  handler: any;

  constructor(errorLogManager: ErrorLogManager, options?: ErrorLogOscillatorOption) {
    super();
    this.options = options;
    this.errorLogManager = errorLogManager;
  }

  start() {
    this.handler = (list) => {
      try {
      this.emit('oscillate', list);
      } catch(err) {
        debug(err);
      }
    };
    this.errorLogManager.on('dump', this.handler);
  }

  stop() {
    this.errorLogManager.removeListener('dump', this.handler);
  }

}
