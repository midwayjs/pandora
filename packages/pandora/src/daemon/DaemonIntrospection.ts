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
      const complex = daemon.apps.get(key);
      const introspection = await complexToIntrospection(complex);
      ret.push(introspection);
    }
    return ret;
  }

  async getApplictaionByName(appName: string): Promise<ApplicationIntrospectionResult> {
    const daemon = this.daemon;
    const complex = daemon.apps.get(appName);
    if(!complex) {
      throw new Error(`Can\'t found an Application it named ${appName}`);
    }
    return complexToIntrospection(complex);
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

async function complexToIntrospection(complex): Promise<ApplicationIntrospectionResult> {

  return {
    state: complex.state,
    mode: complex.mode,
    appName: complex.name,
    appDir: complex.appDir,
    appId: complex.appId,
    pids: complex.pids,
    uptime: complex.uptime,
    startCount: complex.startCount,
    representation: complex.appRepresentation,
    complex: await complex.getComplex(),
    stdoutLogPath: getAppLogPath(complex.name, 'nodejs_stdout')
  };

}
