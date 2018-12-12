import {componentName} from 'pandora-component-decorator';
import {HubServer, HubFacade} from 'pandora-hub';
import {consoleLogger} from 'pandora-dollar';

@componentName('ipcHub')
export default class ComponentIPCHub {

  ctx: any;
  hubServer: HubServer;
  ipcHub: HubFacade;
  constructor(ctx) {
    this.ctx = ctx;
    if(ctx.mode === 'supervisor') {
      this.hubServer = new HubServer;
      ctx.hubServer = this.hubServer;
    } else {
      this.ipcHub = new HubFacade;
      ctx.ipcHub = this.ipcHub;
    }
  }

  async startAtSupervisor() {
    await this.hubServer.start();
    consoleLogger.info(`IPC Hub Server started`);
  }

  async start() {
    const {appName, processName} = this.ctx;
    this.ipcHub.setup({
      location: {
        appName: appName,
        processName: processName,
        pid: process.pid.toString()
      },
      logger: consoleLogger
    });
    await this.ipcHub.start();
    consoleLogger.info(`IPC Hub Client started`);
  }

}