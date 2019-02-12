import {ErrorLog} from './domain';
import {EventEmitter} from 'events';

export class ErrorLogManager extends EventEmitter {

  logger: any;

  constructor(opts: {logger: any}) {
    super();
    this.logger = opts.logger;
  }

  record(errorLog: ErrorLog) {
    try {
      this.emit('dump', [errorLog]);
    } catch(err) {
      this.logger.warn('[ErrorLogManager] emit errorLog error');
      this.logger.warn(err);
    }
  }
}