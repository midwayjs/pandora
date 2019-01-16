import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { MySQLPatcher, MySQLWrapper } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import { fork } from './TestUtil';
import { FakeMySQLServer } from './helpers/fake-mysql-server/FakeMySQLServer';

describe('ComponentAutoPatching -> MySQLPatcher', function () {
  let autoPatching, componentTrace;

  before(async () => {
    const ctx = {
      config: {
        trace: {
          kTracer: PandoraTracer
        }
      }
    };
    componentTrace = new ComponentTrace(ctx);
    await componentTrace.start();
    Object.assign(ctx.config, {
      autoPatching: {
        patchers: {
          mySQL: {
            enabled: true,
            klass: MySQLPatcher,
            kWrapper: MySQLWrapper
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);
    await autoPatching.start();
  });

  it('should only load mySQL patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load mySQL patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      mySQL: {
        enabled: false,
        klass: MySQLPatcher,
        kWrapper: MySQLWrapper
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
    const fakeServerPort = 32893;
    const fakeServer = new FakeMySQLServer();
    fakeServer.listen(fakeServerPort, () => {
      fork('mysql/MySQL', () => {
        fakeServer.destroy();
        done();
      });
    });
  });
});
