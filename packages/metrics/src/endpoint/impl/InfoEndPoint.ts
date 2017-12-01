import {EndPoint} from '../EndPoint';
import {DaemonUtil} from '../../util/DaemonUtil';

export class InfoEndPoint extends EndPoint {
  group: string = 'info';

  async processQueryResults(results, appName) {
    results = super.processQueryResults(results, appName);

    const daemon = DaemonUtil.getDaemon();
    if(!daemon) {
      return results;
    }
    const introspection = daemon.getIntrospection();

    if(appName) {
      const app = await introspection.getApplictaionByName(appName);
      let ret = [{
        key: 'introspection',
        data: app
      }];
      if(results) {
        ret = ret.concat(results);
      }
      return ret;
    }

    const ret = {};
    const appList = await introspection.listApplication();
    for(const app of appList) {
      let found;
      if(results.hasOwnProperty(app.appName)) {
        found = results[app.appName];
      }
      ret[app.appName] = [{
        key: 'introspection',
        data: app
      }];
      if(found) {
        ret[app.appName] = ret[app.appName].concat(found);
      }
    }
    return ret;
  }

}
