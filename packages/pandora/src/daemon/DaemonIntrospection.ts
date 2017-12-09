import {Daemon} from './Daemon';
import {ApplicationIntrospectionResult, DaemonIntrospectionResult} from '../domain';
import {GlobalConfigProcessor} from '../universal/GlobalConfigProcessor';
import {getAppLogPath} from '../universal/LoggerBroker';

export class DaemonIntrospection {

  daemon: Daemon;

  globalProperties = GlobalConfigProcessor.getInstance().getAllProperties();

  constructor(daemon: Daemon) {
    this.daemon = daemon;
  }

  async listApplication(): Promise<ApplicationIntrospectionResult[]> {
    const daemon = this.daemon;
    const keySet = Array.from(daemon.apps.keys());
    const ret: ApplicationIntrospectionResult[] = [];
    for (const key of keySet) {
      const handler = daemon.apps.get(key);
      const introspection = await appToIntrospection(handler);
      ret.push(introspection);
    }
    return ret;
  }

  async getApplictaionByName(appName: string): Promise<ApplicationIntrospectionResult> {
    const daemon = this.daemon;
    const handler = daemon.apps.get(appName);
    if(!handler) {
      throw new Error(`Can\'t found an Application it named ${appName}`);
    }
    return appToIntrospection(handler);
  }

  getLoadedGlobalConfigPaths () {
    return GlobalConfigProcessor.getInstance().loadedConfigPath;
  }

  getLoadedEndPointNames() {
    let loadedEndPoints = [];
    for(let endPointName in this.globalProperties['actuator']['endPoint']) {
      if(this.globalProperties['actuator']['endPoint'][endPointName].enabled) {
        loadedEndPoints.push(endPointName);
      }
    }
    return loadedEndPoints;
  }

  getLoadedReporterNames() {
    let loadedReporters = [];
    for(let reporterName in this.globalProperties['reporter']) {
      if(this.globalProperties['reporter'][reporterName].enabled) {
        loadedReporters.push(reporterName);
      }
    }
    return loadedReporters;
  }

  introspectDaemon (): DaemonIntrospectionResult {
    return  {
      versions: {
        ...process.versions,
        pandora: require('../../package.json').version
      },
      cwd: process.cwd(),
      pid: process.pid,
      uptime: process.uptime(),
      loadedGlobalConfigPaths: this.getLoadedGlobalConfigPaths(),
      loadedEndPoints: this.getLoadedEndPointNames(),
      loadedReporters: this.getLoadedReporterNames(),
    };
  }

}

async function appToIntrospection(handler): Promise<ApplicationIntrospectionResult> {

  const structure = await handler.getStructure();

  return {
    state: handler.state,
    appName: handler.name,
    appDir: handler.appDir,
    appId: handler.appId,
    pids: handler.pids,
    uptime: handler.uptime,
    startCount: handler.startCount,
    restartCount: handler.restartCount,
    representation: handler.processRepresentation,
    complex: structure,
    structure: structure,
    stdoutLogPath: getAppLogPath(handler.name, 'nodejs_stdout')
  };

}
