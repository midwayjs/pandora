import { orderBy } from 'lodash';
import { IIndicator, IndicatorScope } from '../indicator/domain';
import { TraceManager } from './TraceManager';
import { TraceData } from './TraceData';
const debug = require('debug')('pandora:trace:TraceIndicator');


export interface TraceIndicatorInvokeQuery {
  traceId?: string;
  limit?: number;
  traceName?: string;
}

export class TraceIndicator implements IIndicator {

  group = 'trace';
  scope = IndicatorScope.PROCESS;
  traceManager: TraceManager;

  constructor(traceManager: TraceManager) {
    this.traceManager = traceManager;
  }

  async invoke(query: TraceIndicatorInvokeQuery) {
    debug('query is: ', JSON.stringify(query));
    return this.listTrace(query);
  }

  async listTrace(query: TraceIndicatorInvokeQuery) {
    const traces: TraceData[] = this.traceManager.list();
    const ordered = orderBy(traces, [(trace: TraceData) => {
      return trace.getTimestamp();
    }], ['desc']);

    if (query.traceId) {
      return ordered.filter((data) => {
        return data.getTraceId() === query.traceId;
      });
    }

    let result = ordered;

    if (query.traceName) {
      result = ordered.filter((data) => {
        return data.getTraceName().indexOf(query.traceName) > -1;
      });
    }

    return result.slice(0, query.limit || 100);
  }
}
