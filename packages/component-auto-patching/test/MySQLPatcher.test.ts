import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from 'pandora-component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { MySQLPatcher, MySQLWrapper } from '../src/patchers';
import { PandoraTracer } from 'pandora-tracer';
import { fork } from './TestUtil';
import { FakeMySQLServer } from './helpers/fake-mysql-server/FakeMySQLServer';
import { consoleLogger } from 'pandora-dollar';
import * as Parser from '../src/patchers/wrappers/mysql/SqlParser';

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

    fakeServer = new FakeMySQLServer();

    await new Promise((resolve) => {
      fakeServer.listen(fakeServerPort, resolve);
    });
  });

  after(async () => {
    fakeServer.destroy();
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

  it('should create tracing span when request with connection', (done) => {
    fork('mysql/MySQL', done);
  });

  it('should create tracing span when request with pool', (done) => {
    fork('mysql/MySQLPool', done);
  });

  it('should create tracing span when request with pool cluster', (done) => {
    fork('mysql/MySQLPoolCluster', done);
  });

  it('should record sql', (done) => {
    fork('mysql/MySQLRecordSql', done);
  });

  it('should skip trace when span is null', (done) => {
    fork('mysql/MySQLNoTracer', done);
  });

  it('should skip trace when no callback', (done) => {
    fork('mysql/MySQLNoCallback', done);
  });

  it('should return false when wrapper non queriable', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const res = wrapper.wrapQueriable();

    expect(res).to.be.false;
  });

  it('should return false when wrapper non connectable', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const res = wrapper.wrapGetConnection();

    expect(res).to.be.false;
  });

  it('should work well when wrapQueriable throw error in wrap connection', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;
    const stub = sinon.stub(wrapper, 'wrapQueriable').callsFake(() => {
      throw new Error('wrapQueriable');
    });
    const spy = sinon.spy(consoleLogger, 'info');
    wrapper.wrapGetConnection();

    expect(spy.calledWith(sinon.match('[MySQLWrapper] Wrap PoolConnection#query failed.')));
    stub.restore();
    spy.restore();
  });

  it('should not create span when context is null', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;
    const stub = sinon.stub(wrapper.cls, 'get').callsFake(() => {
      return null;
    });

    const span = wrapper.createSpan();

    expect(span).to.be.null;

    stub.restore();
  });

  it('should use default table name', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const tags = wrapper.buildTags({}, {});

    expect(tags['mysql.table']).to.equal('UnknownTable');
  });

  it('should normalize args', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const args = wrapper.argsNormalize(() => {});
    expect(args.cb).to.be.exist;

    const args1 = wrapper.argsNormalize({
      sql: 'select 1'
    }, () => {});

    expect(args1.cb).to.be.exist;
    expect(args1.options.sql).to.equal('select 1');

    const args2 = wrapper.argsNormalize({
      sql: 'select 1',
      _callback: () => {}
    }, {});

    expect(args2.cb).to.be.exist;
    expect(args2.options.sql).to.equal('select 1');
    expect(args2.options.values).to.be.exist;

    const spy = sinon.spy(consoleLogger, 'info');

    wrapper.argsNormalize('select 1', {}, 'test');

    expect(spy.calledWith(sinon.match('[MySQLWrapper] argument callback must be a function when provided'))).to.be.true;

    spy.restore();

    const args3 = wrapper.argsNormalize('select 1', {}, () => {});
    expect(args3.options.sql).to.equal('select 1');
    expect(args3.cb).to.be.exist;
  });

  it('should get instance info', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const spy = sinon.spy(consoleLogger, 'info');
    wrapper.getInstanceInfo({}, {});
    expect(spy.calledWith(sinon.match('No query config, just try to get database name from query'))).to.be.true;

    spy.restore();

    const info = wrapper.getInstanceInfo({
      config: {
        socketPath: '/'
      }
    }, {});

    expect(info.host).to.equal('localhost');
    expect(info.portPath).to.equal('/');
  });

  it('should normalize info', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const stub = sinon.stub(wrapper, 'options').value({
      recordDatabaseName: true,
      recordInstance: true
    });

    const info = wrapper.normalizeInfo({
      host: null,
      databaseName: 1,
      portPath: ''
    });

    expect(info.host).to.equal('UnknownHost');
    expect(info.databaseName).to.equal('1');
    expect(info.portPath).to.equal('Unknown');

    wrapper.normalizeInfo();
    stub.restore();
  });

  it('should parse query', () => {
    const mySQLPatcher = autoPatching.instances.get('mySQL');
    const wrapper = mySQLPatcher.wrapper;

    const stub = sinon.stub(Parser, 'parseSql').callsFake(() => {
      throw new Error('parseSql');
    });
    const spy = sinon.spy(consoleLogger, 'info');
    wrapper.parseQuery({});
    expect(spy.calledWith(sinon.match('parse sql error, origin options is')));
    spy.restore();
    stub.restore();

    const stub1 = sinon.stub(Parser, 'parseSql').callsFake(() => {
      return {
        collection: '`test`'
      };
    });

    const res = wrapper.parseQuery({});
    expect(res.collection).to.equal('test');
    stub1.restore();
  });
});
