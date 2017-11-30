import {EndPoint} from '../EndPoint';
import {DaemonUtil} from '../../util/DaemonUtil';

export class InfoEndPoint extends EndPoint {
  group: string = 'info';

  async processQueryResults(results, appName) {

    const daemon = DaemonUtil.getDaemon();
    if(!daemon) {
      return null;
    }
    const introspection = daemon.getIntrospection();

    results = super.processQueryResults(results);

    let appList;
    if(appName) {
      const app = await introspection.getApplictaionByName(appName);
      appList = [app];
    } else {
      appList = await introspection.listApplication();
    }

    const appList2nd = [];
    for(const app of appList) {
      let found;
      for(const appFromEndpoint of results) {
        if(app.appName === appFromEndpoint.appName) {
          found = appFromEndpoint;
          break;
        }
      }
      appList2nd.push({...found, ...app});
    }

    return appList2nd;

  }

}
