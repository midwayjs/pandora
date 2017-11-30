import {EndPoint} from '../EndPoint';
// import {DaemonUtil} from '../../util/DaemonUtil';

export class InfoEndPoint extends EndPoint {
  group: string = 'info';

  processQueryResults(results) {
    // DaemonUtil.getDaemon().getIntrospection().listApplication();
    const allResults = super.processQueryResults(results);
    return allResults;
  }

}
