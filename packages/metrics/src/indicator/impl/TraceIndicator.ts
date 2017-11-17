import {Indicator} from '../Indicator';
import {IBuilder, IndicatorType} from '../../domain';
import {TraceManager} from '../../trace/TraceManager';

export class TraceIndicator extends Indicator {

  group: string = 'trace';
  type: IndicatorType = 'multiton';
  private traceManager = TraceManager.getInstance();

  async invoke(data: any, builder: IBuilder) {

  }

  getTraceManager() {
    return this.traceManager;
  }

}
