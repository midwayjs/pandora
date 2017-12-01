import {EndPoint} from '../EndPoint';
import {DaemonUtil} from '../../util/DaemonUtil';

export class DaemonEndPoint extends EndPoint {
  group: string = 'daemon';

  processQueryResults(results): any {
    const introspection = DaemonUtil.getDaemon().getIntrospection();
    return introspection.introspectDaemon();
  }

}
