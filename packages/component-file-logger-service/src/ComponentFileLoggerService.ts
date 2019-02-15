import {MessengerServer, MessengerClient} from 'pandora-messenger';
import {componentName, dependencies, componentConfig} from 'pandora-component-decorator';
import {FileLoggerRotator} from './FileLoggerRotator';
import {FileLoggerManager} from './FileLoggerManager';
import {homedir} from 'os';
import {join} from 'path';

@componentName('fileLoggerService')
@dependencies(['ipcHub'])
@componentConfig({
  fileLoggerService: {
    stopWriteWhenNoSupervisor: true,
  },
  coreLogger: {
    enable: false,
    dir: join(homedir(), 'logs', 'pandorajs'),
    type: 'size',
    maxFiles: 2,
    maxFileSize: 100 * 1024 * 1024,
    stdoutLevel: 'NONE',
    level: 'WARN'
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
    this.startRecordingCoreLogger();
  }

  startRecordingCoreLogger() {
    const coreLogger = this.ctx.logger;
    const config = this.ctx.config.coreLogger;
    if(!config.enable) {
      return;
    }
    const ownLogger: Map<string, any> = <any> this.fileLoggerManager.createLogger('core', {
      ...config
    });
    coreLogger.set('file', ownLogger.get('file'));
  }

}

export * from './FileLoggerManager';
export * from './FileLoggerRotator';
export * from './domain';
