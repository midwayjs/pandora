import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { MySQLPatcher } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import { fork } from './TestUtil';
import { FakeMySQLServer } from './helpers/fake-mysql-server/FakeMySQLServer';
import { consoleLogger } from 'pandora-dollar';
import * as Parser from '../src/patchers/SqlParser';
import * as os from 'os';

describe('ComponentAutoPatching -> MySQLPatcher', function () {
  let autoPatching, componentTrace, fakeServer;
  const fakeServerPort = 32893;

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
          mysql: {
            enabled: true,
            klass: MySQLPatcher
          }
        }
      }
    });
    autoPatching = new ComponentAutoPatching(ctx);
    await autoPatching.start();

    fakeServer = new FakeMySQLServer();

    await new Promise((resolve) => {
      fakeServer.listen(fakeServerPort, resolve);
    });
  });

  after(async () => {
    fakeServer.destroy();
  });

  it('should only load mysql patcher', () => {
    const instances = autoPatching.instances;

    expect(instances.size).to.equal(1);
  });

  it('should not load mysql patcher when enabled=false', async () => {
    await autoPatching.stop();

    const stub = sinon.stub(autoPatching, 'patchers').value({
      mysql: {
        enabled: false,
        klass: MySQLPatcher
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

  it('should create tracing span when request with connection', (done) => {
    fork('mysql/MySQL', done);
  });

  it('should create tracing span when request with pool', (done) => {
    fork('mysql/MySQLPool', done);
  });

  it('should create tracing span when request with pool cluster', (done) => {
    fork('mysql/MySQLPoolCluster', done);
  });

  it('should support unattach patcher', (done) => {
    fork('mysql/MySQLUnattach', done);
  });

  it('should skip trace when tracer is null', (done) => {
    fork('mysql/MySQLNoTracer', done);
  });

  it('should skip trace when CURRENT_CONTEXT is null', (done) => {
    fork('mysql/MySQLNoContext', done);
  });

  it('should not record sql when disabled', (done) => {
    fork('mysql/MySQLNotRecordSql', done);
  });

  it('should use custom sql mask', (done) => {
    fork('mysql/MySQLSqlMask', done);
  });

  it('should should record values when exist', (done) => {
    fork('mysql/MySQLValues', done);
  });

  it('should trace when no callback', (done) => {
    fork('mysql/MySQLNoCallback', done);
  });

  it('should recordTable work well', () => {
    const mysqlPatcher = autoPatching.instances.get('mysql');

    const stub = sinon.stub(Parser, 'parseSql').callsFake(() => {
      throw new Error('parseSql');
    });

    const tags = new Map();

    const span = {
      setTag(key, value) {
        tags.set(key, value);
      }
    };

    const spy = sinon.spy(consoleLogger, 'info');

    mysqlPatcher.recordTable(span, {});
    expect(spy.calledWith(sinon.match('parse sql error, origin sql is')));
    spy.restore();
    stub.restore();

    const stub1 = sinon.stub(Parser, 'parseSql').callsFake(() => {
      return {
        collection: '`test`'
      };
    });

    mysqlPatcher.recordTable(span, {});
    expect(tags.get('mysql.table')).to.equal('test');
    stub1.restore();
  });

  it('should transformSql work well', () => {
    const mysqlPatcher = autoPatching.instances.get('mysql');
    const stubOptions = sinon.stub(mysqlPatcher, 'options').value({
      tracing: true
    });

    const logs = [];

    const span = {
      log(content) {
        logs.push(content);
      }
    };

    const empty = {};
    mysqlPatcher.transformSql(span, empty);
    expect(empty).to.deep.equal({});

    const query = {
      sql: 'SELECT 1'
    };
    mysqlPatcher.transformSql(span, query);

    expect(query.sql).to.equal('SELECT 1');

    mysqlPatcher.transformSql(null, query);

    expect(query.sql).to.equal('SELECT 1');

    const stubTracing = sinon.stub(mysqlPatcher, 'tracing').callsFake((span, query) => {
      span.log({
        originSql: query.sql
      });
      query.sql = `/*tracing*/${query.sql}`;
    });

    mysqlPatcher.transformSql(span, query);
    expect(logs.length).to.equal(1);
    expect(logs[0]).to.deep.equal({
      originSql: 'SELECT 1'
    });
    expect(query.sql).to.equal('/*tracing*/SELECT 1');

    stubTracing.restore();

    const spyLogger = sinon.spy(mysqlPatcher.logger, 'warn');
    mysqlPatcher.transformSql(span, query);
    expect(spyLogger.calledWith(sinon.match('[MySQLPatcher] Tracing not implement.')));
    spyLogger.restore();

    stubOptions.restore();
  });

  it('should recordConnectionInfo work well', () => {
    const mysqlPatcher = autoPatching.instances.get('mysql');

    const tags = new Map();
    const span = {
      setTag(key, value) {
        tags.set(key, value);
      }
    };

    mysqlPatcher.recordConnectionInfo(span, {
      _connection: {
        config: {
          socketPath: '/tmpdir/123.sock'
        }
      }
    });

    expect(tags.get('mysql.host')).to.equal(os.hostname());
    expect(tags.get('mysql.portPath')).to.equal('/tmpdir/123.sock');
    expect(tags.get('mysql.database')).to.equal('Unknown');
    tags.clear();

    mysqlPatcher.recordConnectionInfo(span, {
      sql: 'use pandora;',
      _connection: {
        config: {
          host: '30.30.30.30',
          port: 3036
        }
      }
    });

    expect(tags.get('mysql.host')).to.equal('30.30.30.30');
    expect(tags.get('mysql.portPath')).to.equal(3036);
    expect(tags.get('mysql.database')).to.equal('pandora');

    const spy = sinon.spy(consoleLogger, 'info');
    mysqlPatcher.recordConnectionInfo(span, {});

    expect(spy.calledWith(sinon.match('[MySQLPatcher] query without connection info'))).to.be.true;
    spy.restore();
  });
});
