import {EndPoint} from '../EndPoint';
import {MetricsInjectionBridge} from '../../util/MetricsInjectionBridge';

export class DaemonEndPoint extends EndPoint {
  group: string = 'daemon';

  processQueryResults(results): any {
    const introspection = MetricsInjectionBridge.getDaemon().getIntrospection();
    return introspection.introspectDaemon();
  }

}
