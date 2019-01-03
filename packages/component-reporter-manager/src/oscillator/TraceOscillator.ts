import {EventEmitter} from 'events';
import {TraceManager, TRACE_DATA_DUMP} from 'pandora-component-trace';

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
      console.log('#####', list);
    };
    this.traceManager.on(TRACE_DATA_DUMP, this.handler);
  }

  stop() {
    this.traceManager.removeListener(TRACE_DATA_DUMP, this.handler);
  }

}

