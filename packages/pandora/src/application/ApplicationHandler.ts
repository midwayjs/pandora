import {ApplicationRepresentation, ApplicationStructureRepresentation} from '../domain';
import uuid = require('uuid');
import {State} from '../const';
import {ProcfileReconciler} from './ProcfileReconciler';
import {ProcessHandler} from './ProcessHandler';
import {exists} from 'mz/fs';
import {backupLog, getAppLogPath} from '../universal/LoggerBroker';

export class ApplicationHandler {

  public state: State;
  public appId: string = null;
  public appRepresentation: ApplicationRepresentation = null;
  public mountedProcesses: ProcessHandler[];
  private startTime: number;
  private structure: ApplicationStructureRepresentation;

  constructor(appRepresentation: ApplicationRepresentation) {
    this.state = State.pending;
    this.appId = uuid.v4();
    this.appRepresentation = appRepresentation;
  }

  public get name() {
    return this.appRepresentation.appName;
  }

  public get appDir() {
    return this.appRepresentation.appDir;
  }

  public get pids(): Array<number> {
    const ret = [];
    if(this.mountedProcesses) {
      for(const app of this.mountedProcesses) {
        if(app.pid) {
          ret.push(app.pid);
        }
      }
    }
    return ret;
  }

  public get startCount(): number {

    let ret = 0;
    if(this.mountedProcesses) {
      for(const app of this.mountedProcesses) {
        ret += app.startCount;
      }
    }

    return ret;

  }

  public get uptime(): number {
    if(!this.startTime) {
      return 0;
    }
    return (Date.now() - this.startTime) / 1000;
  }

  public async getStructure(): Promise<ApplicationStructureRepresentation> {
    if(!this.structure) {
      this.structure = await ProcfileReconciler.getStructureViaNewProcess(this.appRepresentation);
    }
    return this.structure;
  }

  protected async fillMounted () {
    if(this.mountedProcesses) {
      return;
    }
    this.mountedProcesses = [];
    const {process: mountList} = await this.getStructure();
    for(const mount of mountList) {
      const appHandler = new ProcessHandler(mount);
      this.mountedProcesses.push(appHandler);
    }
  }

  async start () {

    if(!await exists(this.appDir)) {
      new Error(`AppDir ${this.appDir} does not exist`);
    }

    await this.backupStdoutLogFile();

    await this.fillMounted();
    if(!this.mountedProcesses.length) {
      throw new Error('Start failed, looks like not a pandora project, in appDir ' + this.appDir);
    }

    const startedHandlers = [];
    for(const appHandler of this.mountedProcesses) {
      try {
        await appHandler.start();
      } catch (error) {
        for(const started of startedHandlers) {
          await started.stop();
        }
        throw error;
      }
      startedHandlers.push(appHandler);
    }
    this.state = State.complete;
    this.startTime = Date.now();
  }

  async stop () {
    if (this.state === State.stopped) {
      return;
    }
    for(const appHandler of this.mountedProcesses) {
      await appHandler.stop();
    }
    this.state = State.stopped;
  }

  async reload (processName: string) {
    for(const appHandler of this.mountedProcesses) {
      await appHandler.reload(processName);
    }
  }

  async backupStdoutLogFile() {
    const targetPath = getAppLogPath(this.name, 'nodejs_stdout');
    if(await exists(targetPath)) {
      await backupLog(targetPath);
    }
  }

}