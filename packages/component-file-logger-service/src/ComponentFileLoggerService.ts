import {MessengerServer, MessengerClient} from 'pandora-messenger';
import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {FileLoggerRotator} from './FileLoggerRotator';
import {FileLoggerManager} from './FileLoggerManager';

@componentName('fileLoggerService')
@dependencies(['ipcHub'])
@componentConfig({
  fileLoggerService: {
    stopWriteWhenNoSupervisor: true,
  }
})
export default class ComponentFileLoggerService {

  ctx: any;
  fileLoggerRotator: FileLoggerRotator;
  fileLoggerManager: FileLoggerManager;
  constructor(ctx) {
    this.ctx = ctx;
  }

  async startAtSupervisor() {
    const messengerServer: MessengerServer = this.ctx.hubServer.getMessengerServer();
    this.fileLoggerRotator = new FileLoggerRotator();
    this.fileLoggerRotator.setMessengerServer(messengerServer);
    await this.fileLoggerRotator.start();
    await this.startAtAllProcesses();
  }

  async start() {
    await this.startAtAllProcesses();
  }

  async startAtAllProcesses() {
    const messengerClient: MessengerClient = this.ctx.hubFacade.getHubClient().getMessengerClient();
    this.fileLoggerManager = new FileLoggerManager({
      connectRotator: messengerClient.isOK,
      stopWriteWhenNoSupervisor: this.ctx.config.fileLoggerService.stopWriteWhenNoSupervisor
    });
    this.ctx.fileLoggerManager = this.fileLoggerManager;
    this.fileLoggerManager.setMessengerClient(messengerClient);
    await this.fileLoggerManager.start();
  }

}

export * from './FileLoggerManager';
export * from './FileLoggerRotator';
export * from './domain';
