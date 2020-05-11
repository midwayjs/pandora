import { expect } from 'chai';
import {
  ComponentReflector,
  IComponentConstructor,
} from '@pandorajs/component-decorator';
import ComponentFileLoggerService from '../src/ComponentFileLoggerService';
import ComponentIPCHub from '@pandorajs/component-ipc-hub';
import { FileLoggerManager } from '../src/FileLoggerManager';

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
