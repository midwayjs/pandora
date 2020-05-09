import { expect } from 'chai';
import * as sinon from 'sinon';
import ComponentTrace from '@pandorajs/component-trace';
import ComponentAutoPatching from '../src/ComponentAutoPatching';
import { HttpServerPatcher } from '../src/patchers';
import { PandoraTracer } from '@pandorajs/tracer';
import { fork } from './TestUtil';
import * as semver from 'semver';
import { consoleLogger } from '@pandorajs/dollar';
import * as url from 'url';

describe('ComponentAutoPatching -> HttpServerPatcher', function () {
  let autoPatching, componentTrace;

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

  it('should deal args different with node.js v10', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');

    const args = httpServerPatcher.argsCompatible({}, () => {});

    expect(args.withOpts).to.be.true;
    expect(args.requestListener).not.to.be.null;
  });

  it('should deal args different with node.js v10 for transform', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');

    const args = httpServerPatcher.argsTransform(false, () => {}, {});
    expect(args.length).to.equal(1);

    const argsV10 = httpServerPatcher.argsTransform(true, () => {}, {});
    expect(argsV10.length).to.equal(2);
  });

  it('should create tracing span when request', (done) => {
    fork('http-server/HttpServer', done);
  });

  it('should skip request by requestFilter', (done) => {
    fork('http-server/HttpServerFilter', done);
  });

  it('should work well in node.js v10', (done) => {
    if (semver.satisfies(process.version, '10')) {
      fork('http-server/HttpServerWithOpts', done);
    } else {
      console.log('skip http-server args test for node.js v10');
      done();
    }
  });

  it('should skip trace when request listener is null', (done) => {
    fork('http-server/HttpServerWithoutListener', done);
  });

  it('should skip trace when span is null', (done) => {
    fork('http-server/HttpServerSpanNull', done);
  });

  it('should custom trace name work', (done) => {
    fork('http-server/HttpServerTraceName', done);
  });

  it('should deal request error', (done) => {
    fork('http-server/HttpServerError', done);
  });

  it('should record fullUrl', (done) => {
    fork('http-server/HttpServerFullUrl', done);
  });

  it('should record search params', (done) => {
    fork('http-server/HttpServerParams', done);
  });

  it('should record request body', (done) => {
    fork('http-server/HttpServerBody', done);
  });

  it('should record request body with custom transformer', (done) => {
    fork('http-server/HttpServerCustomBody', done);
  });

  it('should url is empty string when req is empty', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');

    const url = httpServerPatcher.getFullUrl();
    expect(url).to.equal('');
  });

  it('should work well when secure url', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');

    const url = httpServerPatcher.getFullUrl({
      connection: {
        encrypted: true
      },
      headers: {
        host: '127.0.0.1'
      },
      url: '/'
    });

    expect(url).to.equal('https://127.0.0.1/');
  });

  it('should work well when check secure failed', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');
    const spy = sinon.spy(consoleLogger, 'error');

    httpServerPatcher.getFullUrl({
      headers: {}
    });

    expect(spy.calledWith(sinon.match('[HttpServerPatcher] check secure failed when record full url.'))).to.be.true;
    spy.restore();
  });

  it('should work well when custom body transformer error', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');
    const spy = sinon.spy(consoleLogger, 'error');
    const stub = sinon.stub(httpServerPatcher, 'options').value({
      bodyTransformer: function bodyTransformer() {
        throw new Error('custom body transformer');
      }
    });

    httpServerPatcher.bodyTransformer(Buffer.from('test'));

    expect(spy.calledWith(sinon.match('[HttpServerPatcher] transform body data error.'))).to.be.true;
    spy.restore();
    stub.restore();
  });

  it('should work well when parse search params error', () => {
    const httpServerPatcher = autoPatching.instances.get('httpServer');
    const spy = sinon.spy(consoleLogger, 'error');
    const urlStub = sinon.stub(url, 'parse').callsFake(() => {
      throw new Error('url parse');
    });
    const stub = sinon.stub(httpServerPatcher, 'options').value({
      recordSearchParams: true
    });

    httpServerPatcher.recordSearchParams({}, {
      url: 'test'
    });

    expect(spy.calledWith(sinon.match('[HttpServerPatcher] record search params error.'))).to.be.true;
    spy.restore();
    stub.restore();
    urlStub.restore();
  });
});
