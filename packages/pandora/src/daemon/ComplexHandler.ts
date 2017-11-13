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

  private complexStructure: ComplexApplicationStructureRepresentation;

  constructor(appRepresentation: ApplicationRepresentation) {
    this.state = State.pending;
    this.appId = uuid.v4();
    this.appRepresentation = appRepresentation;
    if(!existsSync(this.appDir)) {
      new Error(`AppDir ${this.appDir} does not exist`);
    }
  }

  protected async getComplex(): Promise<ComplexApplicationStructureRepresentation> {
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
    for(const appHandler of this.mountedApplications) {
      await appHandler.start();
    }
    this.state = State.complete;
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