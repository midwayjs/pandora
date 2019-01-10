import {EventEmitter} from 'events';
import {ErrorLogManager} from 'pandora-component-error-log';

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
      this.emit('oscillate', list);
    };
    this.errorLogManager.on('dump', this.handler);
  }

  stop() {
    this.errorLogManager.removeListener('dump', this.handler);
  }

}

