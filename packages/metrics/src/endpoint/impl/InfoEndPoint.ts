import {EndPoint} from '../EndPoint';

export class InfoEndPoint extends EndPoint {
  group: string = 'info';

  processQueryResults(results) {
    let allResults = super.processQueryResults(results);
    let apps = DaemonBootstrapUtil.getLatestDaemonInstance().listApplication();
    return allResults.map((result) => {
      result.reboot = apps[result['appName']].reboot;
      return result;
    });
  }

}
