import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { MySQL2Patcher, MySQLWrapper } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import { fork } from './TestUtil';
import { createServer } from 'mysql2';
import { consoleLogger } from 'pandora-dollar';
const ClientFlags = require('mysql2/lib/constants/client.js');

describe('ComponentAutoPatching -> MySQL2Patcher', function () {
  let autoPatching, componentTrace, server;

  before(async () => {
    const ctx = {
      logger: consoleLogger,
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
          mySQL2: {
            enabled: true,
            klass: MySQL2Patcher,
            kWrapper: MySQLWrapper
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);
    await autoPatching.start();

    server = createServer();
    server.on('connection', function(conn) {
      conn.on('error', function() {
        console.log('client drop connection');
      });

      let flags = 0xffffff;
      flags = flags ^ ClientFlags.COMPRESS;

      conn.serverHandshake({
        protocolVersion: 10,
        serverVersion: 'node.js rocks',
        connectionId: 1234,
        statusFlags: 2,
        characterSet: 8,
        capabilityFlags: flags
      });
    });
    server.listen(32883);
  });

  after(async () => {
    server.close();
  });

  it('should only load mySQL2 patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load mySQL2 patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      mySQL: {
        enabled: false,
        klass: MySQL2Patcher,
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
    fork('mysql2/MySQL2', done);
  });
});
