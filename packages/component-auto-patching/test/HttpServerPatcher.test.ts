import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { HttpServerPatcher } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import { fork } from './TestUtil';

describe('ComponentAutoPatching -> HttpServerPatcher', function () {
  let autoPatching, componentTrace;

  before(async () => {
    const ctx = {
      options: {
        trace: {
          kTracer: PandoraTracer
        }
      }
    };
    componentTrace = new ComponentTrace(ctx);
    await componentTrace.start();

    Object.assign(ctx.options, {
      autoPatching: {
        patchers: {
          httpServer: {
            enabled: true,
            klass: HttpServerPatcher
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);

    await autoPatching.start();
  });

  it('should only load httpServer patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load httpServer patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      httpServer: {
        enabled: false,
        klass: HttpServerPatcher
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

  it('should create tracing span when request', (done) => {
    fork('http-server/HttpServer', done);
  });
});