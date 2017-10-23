import {Transport} from 'egg-logger';
import {EventEmitter} from 'events';
export class EmitterTransport extends Transport {

  eventEmitter: EventEmitter;
  loggerName: string;
  fileName: string;
  filePath: string;
  constructor(options, eventEmitter) {
    super(options);
    this.eventEmitter = eventEmitter;
    this.loggerName = options.loggerName;
    this.fileName = options.fileName;
    this.filePath = options.filePath;
  }

  log(level, args, meta) {
    const formattedMessage = super.log(level, args, meta);
    const {loggerName, fileName, filePath} = this;
    this.eventEmitter.emit('log', {
      loggerName, fileName, filePath,
      level, args, meta, formattedMessage
    });
  }

}