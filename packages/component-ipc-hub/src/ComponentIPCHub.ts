import {componentName} from 'pandora-component-decorator';
import {HubServer, HubFacade} from 'pandora-hub';
import {consoleLogger} from 'pandora-dollar';

@componentName('ipcHub')
export default class ComponentIPCHub {

  ctx: any;
  hubServer: HubServer;
  hubFacade: HubFacade;
  constructor(ctx) {
    this.ctx = ctx;
    if(ctx.mode === 'supervisor') {
      this.hubServer = new HubServer;
      ctx.hubServer = this.hubServer;
    }
    this.hubFacade = new HubFacade;
    ctx.hubFacade = this.hubFacade;
  }

  async startAtSupervisor() {
    await this.hubServer.start();
    consoleLogger.info('IPC Hub Server started');
    await this.startClient();
    await this.hubFacade.initConfigManager();
  }

  async start() {
    await this.startClient();
    await this.hubFacade.initConfigClient();
  }

  async startClient() {
    const {appName, processName} = this.ctx;
    this.hubFacade.setup({
      location: {
        appName: appName,
        processName: processName,
        pid: process.pid.toString()
      },
      logger: consoleLogger
    });
    try {
      await this.hubFacade.start();
      consoleLogger.info('IPC Hub Client started at PID ' + process.pid);
    } catch(err) {
      consoleLogger.warn('IPC Hub Client start failed at PID ' + process.pid + ', ' + err);
    }
  }

  async stop() {
    await this.hubFacade.stop();
  }

  async stopAtSupervisor() {
    await this.hubFacade.stop();
    await this.hubServer.stop();
  }

}