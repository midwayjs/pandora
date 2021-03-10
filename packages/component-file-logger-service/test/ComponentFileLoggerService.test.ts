import { expect } from 'chai';
import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import ComponentFileLoggerService from '../src/ComponentFileLoggerService';
import ComponentIPCHub from '@pandorajs/component-ipc-hub';
import { FileLoggerManager } from '../src/FileLoggerManager';
import ComponentActuatorServer from '@pandorajs/component-actuator-server';
import * as request from 'supertest';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as fs from 'mz/fs';
import * as sinon from 'sinon';

describe('ComponentFileLoggerService', () => {
  it('should have correct meta info', () => {
    expect(
      ComponentReflector.getComponentName(
        ComponentFileLoggerService as IComponentConstructor
      )
    ).to.be.equal('fileLoggerService');
    expect(
      ComponentReflector.getDependencies(
        ComponentFileLoggerService as IComponentConstructor
      )
    ).to.deep.equal(['ipcHub']);
    expect(
      ComponentReflector.getComponentConfig<any>(
        ComponentFileLoggerService as IComponentConstructor
      ).fileLoggerService.stopWriteWhenNoSupervisor
    ).to.be.ok;
  });

  it('should work at supervisor mode be ok', async () => {
    const ctx: any = {
      mode: 'supervisor',
      config: {
        coreLogger: {
          enable: false,
        },
        fileLoggerService: {
          stopWriteWhenNoSupervisor: true,
        },
      },
    };
    const componentIPCHub = new ComponentIPCHub(ctx);
    const componentFileLoggerService = new ComponentFileLoggerService(ctx);
    await componentIPCHub.startAtSupervisor();
    await componentFileLoggerService.startAtSupervisor();
    expect(ctx.fileLoggerManager).to.be.an.instanceof(FileLoggerManager);
  });

  describe('supervisor with endpoint', async () => {
    let componentActuatorServer;
    let componentIPCHub;
    let componentFileLoggerService;
    let server;

    const tmpDir = path.join(__dirname, '.tmp');
    mkdirp.sync(tmpDir);

    async function sleep(timeout) {
      return new Promise(resolve => {
        setTimeout(resolve, timeout);
      });
    }

    it('should work', async () => {
      const ctx: any = {
        mode: 'supervisor',
        config: {
          coreLogger: {
            enable: false,
          },
          fileLoggerService: {
            stopWriteWhenNoSupervisor: true,
            endpoint: true,
          },
          actuatorServer: {
            http: {
              enabled: true,
              host: '127.0.0.1',
              port: 7007,
            },
          },
        },
      };

      componentActuatorServer = new ComponentActuatorServer(ctx);
      await componentActuatorServer.startAtSupervisor();
      componentIPCHub = new ComponentIPCHub(ctx);
      componentFileLoggerService = new ComponentFileLoggerService(ctx);
      await componentIPCHub.startAtSupervisor();
      await componentFileLoggerService.startAtSupervisor();
      expect(ctx.fileLoggerManager).to.be.an.instanceof(FileLoggerManager);

      server = componentActuatorServer.actuatorRestServer.server;
      const res = await request(server)
        .get('/file-logger/register')
        .expect(200);
      expect(res.body.message).to.equal('file path is need');
    });

    it('should work when add file', async () => {
      const stub = sinon
        .stub(
          componentFileLoggerService.fileLoggerRotator,
          'caclIntervalForRotateLogBySize'
        )
        .callsFake(() => {
          return 1000;
        });

      const tmpPath = path.join(
        tmpDir,
        `${Date.now()}-register-file-by-endpoint-test.log`
      );

      await fs.writeFile(tmpPath, '*');

      const res = await request(server)
        .get(
          `/file-logger/register?filePath=${tmpPath}&maxFileSize=1024&rotateDuration=3000`
        )
        .expect(200);
      expect(res.body.data).to.match(
        /rotate by size \[1024\] bytes with internal \[3000\]ms/
      );

      await fs.writeFile(tmpPath, '*'.repeat(1024));

      await sleep(5000);

      const fileData = await fs.readFile(tmpPath, 'utf-8');
      expect(fileData).to.equal('');
      stub.restore();
    });

    it('should failed when add file by api without file', async () => {
      expect(() => {
        componentFileLoggerService.registerFileToRotate();
      }).throw(/file path is need/);
    });

    it('should work when add file by api', async () => {
      const stub = sinon
        .stub(
          componentFileLoggerService.fileLoggerRotator,
          'caclIntervalForRotateLogBySize'
        )
        .callsFake(() => {
          return 1000;
        });

      const tmpPath = path.join(
        tmpDir,
        `${Date.now()}-register-file-by-api-test.log`
      );

      await fs.writeFile(tmpPath, '*');

      componentFileLoggerService.registerFileToRotate(
        tmpPath,
        'size-truncate',
        1024,
        3000
      );

      await fs.writeFile(tmpPath, '*'.repeat(1024));

      await sleep(5000);

      const fileData = await fs.readFile(tmpPath, 'utf-8');
      expect(fileData).to.equal('');
      stub.restore();
    });

    it('should work when remove rotator strategy by api', async () => {
      const stub = sinon
        .stub(
          componentFileLoggerService.fileLoggerRotator,
          'caclIntervalForRotateLogBySize'
        )
        .callsFake(() => {
          return 1000;
        });

      const tmpPath = path.join(
        tmpDir,
        `${Date.now()}-remove-rotator-strategy-by-api-test.log`
      );

      await fs.writeFile(tmpPath, '*');

      const uuid = componentFileLoggerService.registerFileToRotate(
        tmpPath,
        'size-truncate',
        1024,
        3000
      );

      await fs.writeFile(tmpPath, '*'.repeat(1024));

      await sleep(5000);

      let fileData = await fs.readFile(tmpPath, 'utf-8');
      expect(fileData).to.equal('');

      componentFileLoggerService.removeRotateStrategy(uuid);
      await fs.writeFile(tmpPath, '*'.repeat(2000));

      await sleep(5000);

      fileData = await fs.readFile(tmpPath, 'utf-8');
      expect(fileData.length).to.equal(2000);

      stub.restore();

      await fs.truncate(tmpPath, 0);
    });
  });

  it('should work at worker mode be ok', async () => {
    const ctx: any = {
      mode: 'worker',
      config: {
        coreLogger: {
          enable: false,
        },
        fileLoggerService: {
          stopWriteWhenNoSupervisor: true,
        },
      },
    };
    const componentIPCHub = new ComponentIPCHub(ctx);
    const componentFileLoggerService = new ComponentFileLoggerService(ctx);
    await componentIPCHub.start();
    await componentFileLoggerService.start();
    expect(ctx.fileLoggerManager).to.be.an.instanceof(FileLoggerManager);
  });
});
