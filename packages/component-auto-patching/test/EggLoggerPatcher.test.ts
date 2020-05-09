import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from '@pandorajs/component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { EggLoggerPatcher } from '../src/patchers';
import { PandoraTracer } from '@pandorajs/tracer';
import { fork } from './TestUtil';
import { consoleLogger } from '@pandorajs/dollar';
import ComponentErrorLog from '@pandorajs/component-error-log';

describe('ComponentAutoPatching -> EggLoggerPatcher', function () {
  let autoPatching, componentTrace, componentErrorLog;

  before(async () => {
    const ctx: any = {
      logger: consoleLogger,
      endPointManager: { register() {} },
      indicatorManager: { register() {} },
      config: {
        trace: {
          kTracer: PandoraTracer
        },
        errorLog: {}
      },
    };
    componentTrace = new ComponentTrace(ctx);
    await componentTrace.start();

    componentErrorLog = new ComponentErrorLog(ctx);
    ctx.errorLogManager = componentErrorLog.errorLogManager;

    Object.assign(ctx.config, {
      autoPatching: {
        patchers: {
          eggLogger: {
            enabled: true,
            klass: EggLoggerPatcher
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);
    await autoPatching.start();

  });

  after(async () => {
    await autoPatching.stop();
  });

  it('should only load eggLogger patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load eggLogger patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      eggLogger: {
        enabled: false,
        klass: EggLoggerPatcher
      }
    });

    await autoPatching.start();

    let instances = autoPatching.instances;
    expect(instances.size).to.equal(0);

    await autoPatching.stop();
    stub.restore();
    await autoPatching.start();

    instances = autoPatching.instances;
    expect(instances.size).to.equal(1);
  });

  it('should be work well when eggLogger enabled', (done) => {
    fork('egg-logger/eggLogger', done);
  });

  it('should work well when errorLogManager throw error', (done) => {
    fork('egg-logger/eggLoggerException', done);
  });

});
