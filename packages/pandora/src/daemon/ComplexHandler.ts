import {ApplicationRepresentation, ComplexApplicationStructureRepresentation} from '../domain';
import uuid = require('uuid');
import {State} from '../const';
import {ProcfileReconciler} from '../application/ProcfileReconciler';
import {ApplicationHandler} from '../application/ApplicationHandler';
import {existsSync} from 'fs';

export class ComplexHandler {

  public state: State;
  public appId: string = null;
  public appRepresentation: ApplicationRepresentation = null;
  public mountedApplications: ApplicationHandler[];
  private startTime: number;
  private complexStructure: ComplexApplicationStructureRepresentation;

  constructor(appRepresentation: ApplicationRepresentation) {
    this.state = State.pending;
    this.appId = uuid.v4();
    this.appRepresentation = appRepresentation;
    if(!existsSync(this.appDir)) {
      new Error(`AppDir ${this.appDir} does not exist`);
    }
  }

  public get name() {
    return this.appRepresentation.appName;
  }

  public get appDir() {
    return this.appRepresentation.appDir;
  }

  public get mode() {
    return this.appRepresentation.mode;
  }

  public get pids(): Array<number> {
    const ret = [];
    if(this.mountedApplications) {
      for(const app of this.mountedApplications) {
        if(app.pid) {
          ret.push(app.pid);
        }
      }
    }
    return ret;
  }

  public get startCount(): number {

    let ret = 0;
    if(this.mountedApplications) {
      for(const app of this.mountedApplications) {
        ret += app.startCount;
      }
    }

    return ret;

  }

  public get uptime(): number {
    if(!this.startTime) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  public async getComplex(): Promise<ComplexApplicationStructureRepresentation> {
    if(!this.complexStructure) {
      this.complexStructure = await ProcfileReconciler.getComplexViaNewProcess(this.appRepresentation);
    }
    return this.complexStructure;
  }

  protected async fillMounted () {
    if(this.mountedApplications) {
      return;
    }
    this.mountedApplications = [];
    const {mount: mountList} = await this.getComplex();
    for(const mount of mountList) {
      const appHandler = new ApplicationHandler(mount);
      this.mountedApplications.push(appHandler);
    }
  }

  async start () {
    await this.fillMounted();
    if(!this.mountedApplications.length) {
      throw new Error('Start failed, looks like not a pandora project, in appDir ' + this.appDir);
    }
    const startedHandlers = [];
    for(const appHandler of this.mountedApplications) {
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
    for(const appHandler of this.mountedApplications) {
      await appHandler.stop();
    }
    this.state = State.stopped;
  }

  async reload (processName: string) {
    for(const appHandler of this.mountedApplications) {
      await appHandler.reload(processName);
    }
  }

}