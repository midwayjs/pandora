import {IIndicator, IndicatorScope} from 'pandora-component-indicator';
import {ErrorLog} from './domain';
import {RecentWindow} from './RecentWindow';


export interface ErrorLogIndicatorInvokeQuery {
  action: 'list';
  limit?: number;
}

export class ErrorLogIndicator implements IIndicator {

  group = 'errorLog';
  scope = IndicatorScope.PROCESS;
  recentWindow: RecentWindow<ErrorLog>;

  constructor(recentWindow: RecentWindow<ErrorLog>) {
    this.recentWindow = recentWindow;
  }

  async invoke(query: ErrorLogIndicatorInvokeQuery) {

    if(query.action === 'list') {
      const ret = this.recentWindow.list().reverse();
      if(query.limit) {
        return ret.slice(0, query.limit);
      }
      return ret;
    }

  }

}

