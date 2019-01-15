import {EventEmitter} from 'events';
import {TraceManager} from 'pandora-component-trace';

const TRACE_DATA_DUMP = 'Trace:Data_Dump';

export interface TraceOscillatorOption {
}

export class TraceOscillator extends EventEmitter {

  options;
  traceManager: TraceManager;
  handler: any;

  constructor(traceManager: TraceManager, options?: TraceOscillatorOption) {
    super();
    this.options = options;
    this.traceManager = traceManager;
  }

  start() {
    this.handler = (list) => {
      this.emit('oscillate', list);
    };
    this.traceManager.on(TRACE_DATA_DUMP, this.handler);
  }

  stop() {
    this.traceManager.removeListener(TRACE_DATA_DUMP, this.handler);
  }

}

