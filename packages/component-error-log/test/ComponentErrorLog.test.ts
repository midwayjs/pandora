import {expect} from 'chai';
import {ComponentReflector, IComponentConstructor} from 'pandora-component-decorator';
import ComponentErrorLog from '../src/ComponentErrorLog';
import {ErrorLogManager} from '../src/ErrorLogManager';


describe('ComponentErrorLog', function () {

  it('should have correct meta info', () => {
    expect(ComponentReflector.getComponentName(<IComponentConstructor> ComponentErrorLog)).to.be.equal('errorLog');
    expect(ComponentReflector.getComponentConfig<any>(<IComponentConstructor> ComponentErrorLog).errorLog.poolSize).to.be.ok;
    expect(ComponentReflector.getComponentConfig<any>(<IComponentConstructor> ComponentErrorLog).errorLog.interval).to.be.ok;
  });

  it('should work at supervisor mode be ok', async () => {
    const ctx: any = {
      mode: 'supervisor',
      config: {
        errorLog: {
          interval: 60 * 1000,
          poolSize: 100
        }
      }
    };
    const componentErrorLog = new ComponentErrorLog(ctx);
    const errorLogManager: ErrorLogManager = ctx.errorLogManager;
    expect(errorLogManager).to.be.an.instanceof(ErrorLogManager);
    await componentErrorLog.startAtSupervisor();
    expect(errorLogManager.running).to.be.equal(true);
    await componentErrorLog.stopAtSupervisor();
    expect(errorLogManager.running).to.be.equal(false);
  });

  it('should work at worker mode be ok', async () => {
    const ctx: any = {
      mode: 'worker',
      config: {
        errorLog: {
          interval: 60 * 1000,
          poolSize: 100
        }
      }
    };
    const componentErrorLog = new ComponentErrorLog(ctx);
    const errorLogManager: ErrorLogManager = ctx.errorLogManager;
    expect(errorLogManager).to.be.an.instanceof(ErrorLogManager);
    await componentErrorLog.start();
    expect(errorLogManager.running).to.be.equal(true);
    await componentErrorLog.stop();
    expect(errorLogManager.running).to.be.equal(false);
  });

});
