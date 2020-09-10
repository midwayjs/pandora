import mm from 'egg-mock';
import { TestMeterProvider } from 'test-util';
import { Resource } from '@opentelemetry/resources';
import { NoopTracerProvider } from '@opentelemetry/api';
import { ExceptionProcessor } from '@pandorajs/component-logger';
import ComponentEggInstrument from '../src/ComponentEggInstrument';

describe('do instrument', () => {
  let app;
  after(() => app?.close());
  it('create ComponentEggInstrument', async () => {
    app = mm.app({
      baseDir: 'egg',
    });
    const ctx: any = {
      mode: 'supervisor',
      resource: new Resource({}),
      meterProvider: new TestMeterProvider(),
      tracerProvider: new NoopTracerProvider(),
      exceptionProcessor: new ExceptionProcessor(),
    };

    await app.ready();
    const comp = new ComponentEggInstrument(ctx);
    ctx.eggInstrument(app);
  });
});

describe('instruments data', () => {
  let app;
  let comp;
  before(async () => {
    app = mm.app({
      baseDir: 'egg',
    });
    const ctx: any = {
      mode: 'supervisor',
      resource: new Resource({}),
      meterProvider: new TestMeterProvider(),
      tracerProvider: new NoopTracerProvider(),
      exceptionProcessor: new ExceptionProcessor(),
    };

    await app.ready();
    comp = new ComponentEggInstrument(ctx);
    ctx.eggInstrument(app);
  });
  after(() => app.close());

  it('should request /', () => {
    return app.httpRequest().get('/').expect(200);
  });

  it('should request /bad-request', () => {
    return app.httpRequest().get('/bad-request').expect(400);
  });

  it('should request /error', () => {
    return app.httpRequest().get('/error').expect(500);
  });
});
