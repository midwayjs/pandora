import { MessengerServer, MessengerClient } from '@pandorajs/messenger';
import {
  componentName,
  dependencies,
  componentConfig,
} from '@pandorajs/component-decorator';
import { homedir } from 'os';
import { join } from 'path';
import { FileLoggerRotator } from './FileLoggerRotator';
import { FileLoggerManager } from './FileLoggerManager';
import { FileLoggerEndPoint } from './FileLoggerEndPoint';
import * as assert from 'assert';
import * as UUID from 'uuid';

@componentName('fileLoggerService')
@dependencies(['ipcHub'])
@componentConfig({
  fileLoggerService: {
    stopWriteWhenNoSupervisor: true,
    endpoint: false,
  },
  coreLogger: {
    enable: false,
    dir: join(homedir(), 'logs', 'pandorajs'),
    type: 'size',
    maxFiles: 2,
    maxFileSize: 100 * 1024 * 1024,
    stdoutLevel: 'NONE',
    level: 'WARN',
  },
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

    if (
      this.ctx.config.fileLoggerService.endpoint &&
      this.ctx.endPointManager
    ) {
      // weak dependences on actuatorServer, depend on ASCII order
      this.ctx.endPointManager.register(
        new FileLoggerEndPoint(this.ctx, this.fileLoggerRotator)
      );
    }

    this.fileLoggerRotator.setMessengerServer(messengerServer);
    await this.fileLoggerRotator.start();
    await this.startAtAllProcesses();
  }

  async start() {
    await this.startAtAllProcesses();
  }

  async startAtAllProcesses() {
    const messengerClient: MessengerClient = this.ctx.hubFacade
      .getHubClient()
      .getMessengerClient();
    this.fileLoggerManager = new FileLoggerManager({
      connectRotator: messengerClient.isOK,
      stopWriteWhenNoSupervisor: this.ctx.config.fileLoggerService
        .stopWriteWhenNoSupervisor,
    });
    this.ctx.fileLoggerManager = this.fileLoggerManager;
    this.fileLoggerManager.setMessengerClient(messengerClient);
    await this.fileLoggerManager.start();
    this.startRecordingCoreLogger();
  }

  registerFileToRotate(
    filePath: string,
    type?: string,
    maxFileSize?: number,
    rotateDuration?: number
  ) {
    maxFileSize = maxFileSize || 100 * 1024 * 1024;
    rotateDuration = rotateDuration || 10 * 60 * 1000;
    type = type || 'size';

    assert(filePath, 'file path is need');

    this.fileLoggerRotator.receiveStrategy({
      uuid: UUID.v4(),
      type: 'size-truncate',
      file: filePath,
      rotateDuration,
      maxFileSize,
    });
  }

  startRecordingCoreLogger() {
    const coreLogger = this.ctx.logger;
    const config = this.ctx.config.coreLogger;
    if (!config.enable) {
      return;
    }
    const ownLogger: Map<string, any> = this.fileLoggerManager.createLogger(
      'core',
      {
        ...config,
      }
    ) as any;
    coreLogger.set('file', ownLogger.get('file'));
  }
}

export * from './FileLoggerManager';
export * from './FileLoggerRotator';
export * from './types';
