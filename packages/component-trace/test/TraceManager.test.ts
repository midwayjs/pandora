import { expect } from 'chai';
import { TraceManager } from '../src/TraceManager';
import { EventEmitter } from 'events';
import { SPAN_CREATED, SPAN_FINISHED, TRACE_DATA_DUMP, TraceStatus } from '../src/constants';
import * as sinon from 'sinon';

async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('TraceManager', () => {

  it('should construct without tracer be ok', () => {
    const traceManager: TraceManager = new TraceManager();
    expect(traceManager.tracer).to.be.undefined;
  });

  it('should construct without tracer be ok', () => {

    class Tracer extends EventEmitter {
    }

    const tracer: any = new Tracer();

    const traceManager: TraceManager = new TraceManager({
      tracer
    });

    expect(traceManager.tracer).to.be.an.instanceof(Tracer);

  });

  it('should record() be ok', () => {

    const traceManager: TraceManager = new TraceManager();

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    });
    traceManager.record(entrySpan, true);
    expect(traceManager.list()[0].getSpans()).to.deep.equal([entrySpan]);

    expect(traceManager.list()[0]).to.be.include({
      traceName: 'test_name',
      traceId: 'test_traceId'
    });

    const normalSpan: any = new EventEmitter;
    Object.assign(normalSpan, {
      traceId: 'test_traceId',
    });
    traceManager.record(normalSpan, false);
    expect(traceManager.list()[0].getSpans()).to.deep.equal([entrySpan, normalSpan]);

    entrySpan.emit(SPAN_FINISHED, entrySpan);

    expect(traceManager.list()[0].getDuration()).to.be.equal(entrySpan.duration);

  });

  it('should record() twice with same traceId be ok', () => {

    const traceManager: TraceManager = new TraceManager();

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    });
    traceManager.record(entrySpan, true);
    traceManager.record(entrySpan, true);
    traceManager.record(entrySpan, true);

    expect(traceManager.list().length).to.be.equal(1);

  });

  it('should record() and get traceName from options.traceName() be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      traceName(span) {
        return (<any> span).__traceName;
      }
    });

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      __traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    });
    traceManager.record(entrySpan, true);

    expect(traceManager.list()[0].getTraceName()).to.be.equal(entrySpan.__traceName);

  });

  it('should record() and detect slow status be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      slowThreshold: 50
    });

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    });
    traceManager.record(entrySpan, true);
    entrySpan.emit(SPAN_FINISHED, entrySpan);
    expect(traceManager.list()[0].getStatus()).to.be.equal(TraceStatus.Slow);

  });

  it('should record() and detect error status be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      slowThreshold: 1000
    });

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: (name) => name === 'error'
    });
    traceManager.record(entrySpan, true);
    entrySpan.emit(SPAN_FINISHED, entrySpan);
    expect(traceManager.list()[0].getStatus()).to.be.equal(TraceStatus.Error);

  });

  it('should dump when over pool size be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      poolSize: 10
    });

    let gotDump = null;
    traceManager.on(TRACE_DATA_DUMP, (data) => {
      gotDump = data;
    });

    for(let idx = 0; idx < 11; idx++) {
      const entrySpan: any = new EventEmitter;
      Object.assign(entrySpan, {
        traceId: 'test_traceId_' + idx,
        traceName: 'test_name_' + idx,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });
      traceManager.record(entrySpan, true);
      entrySpan.emit(SPAN_FINISHED, entrySpan);
    }

    expect(gotDump.length).to.be.equal(10);

  });

  it('should dump all be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      poolSize: 10
    });

    let gotDump = null;
    traceManager.on(TRACE_DATA_DUMP, (data) => {
      gotDump = data;
    });

    for(let idx = 0; idx < 6; idx++) {
      const entrySpan: any = new EventEmitter;
      Object.assign(entrySpan, {
        traceId: 'test_traceId_' + idx,
        traceName: 'test_name_' + idx,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });
      traceManager.record(entrySpan, true);

      if(idx % 2 === 1) {
        entrySpan.emit(SPAN_FINISHED, entrySpan);
      }
    }

    traceManager.dump(true);
    expect(gotDump.length).to.be.equal(6);

  });

  it('should dump all finished be ok', () => {

    const traceManager: TraceManager = new TraceManager({
      poolSize: 10
    });

    let gotDump = null;
    traceManager.on(TRACE_DATA_DUMP, (data) => {
      gotDump = data;
    });

    for(let idx = 0; idx < 6; idx++) {
      const entrySpan: any = new EventEmitter;
      Object.assign(entrySpan, {
        traceId: 'test_traceId_' + idx,
        traceName: 'test_name_' + idx,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });
      traceManager.record(entrySpan, true);

      if(idx % 2 === 1) {
        entrySpan.emit(SPAN_FINISHED, entrySpan);
      }
    }

    traceManager.dump();
    expect(gotDump.length).to.be.equal(3);

  });

  it('should dump by interval be ok', async () => {

    const traceManager: TraceManager = new TraceManager({
      interval: 1000,
      poolSize: 500
    });

    let gotDump = null;
    traceManager.on(TRACE_DATA_DUMP, (data) => {
      gotDump = data;
    });

    traceManager.start();
    traceManager.start();

    const entrySpan: any = new EventEmitter;
    Object.assign(entrySpan, {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    });
    traceManager.record(entrySpan, true);
    entrySpan.emit(SPAN_FINISHED, entrySpan);

    await sleep(2000);

    expect(gotDump.length).to.be.equal(1);

    traceManager.stop();
    traceManager.stop();

  });

  it('should avoid dump() error at timer handler', async () => {

    const traceManager: TraceManager = new TraceManager({
      interval: 1000,
      poolSize: 500
    });
    (<any> traceManager).dump = () => {
      throw new Error('fake error');
    };

    traceManager.start();

    await sleep(2000);

    traceManager.stop();

  });

  it('should call record() when this._tracer got a SPAN_CREATED event', () => {

    class Tracer extends EventEmitter {
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      tracer
    });

    let got = null;
    (<any> traceManager).record = (span, isEntry) => {
      got = [span, isEntry];
    };

    const fakeSpan = {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      isEntry: true
    };

    traceManager.tracer.emit(SPAN_CREATED, fakeSpan);
    expect(got).to.deep.equal([fakeSpan, fakeSpan.isEntry]);

  });

  it('should trace sampling work well with 100%', () => {

    class Tracer extends EventEmitter {
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      sampling: 100,
      tracer
    });

    const spy = sinon.spy(traceManager, 'isSampled');

    for (let idx = 0; idx < 10; idx ++) {
      const entrySpan: any = new EventEmitter;

      Object.assign(entrySpan, {
        traceId: `test_traceId_${idx}`,
        traceName: `test_name_${idx}`,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });

      traceManager.record(entrySpan, true);
    }

    expect(spy.callCount).to.equal(10);
    expect(spy.alwaysReturned(true)).to.be.true;
  });

  it('should trace sampling work well with 10%', () => {

    class Tracer extends EventEmitter {
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      sampling: 10,
      tracer
    });

    const spy = sinon.spy(traceManager, 'isSampled');

    for (let idx = 0; idx < 100; idx ++) {
      const entrySpan: any = new EventEmitter;

      Object.assign(entrySpan, {
        traceId: `test_traceId_${idx}`,
        traceName: `test_name_${idx}`,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });

      traceManager.record(entrySpan, true);
    }

    expect(spy.callCount).to.equal(100);
    expect(spy.returned(true)).to.be.true;
    spy.restore();
  });

  it('should trace sampling work well with function', () => {

    class Tracer extends EventEmitter {
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      sampling: (span) => {
        return span.traceId === 'test_traceId_3';
      },
      tracer
    });

    const spy = sinon.spy(traceManager, 'isSampled');

    for (let idx = 0; idx < 10; idx ++) {
      const entrySpan: any = new EventEmitter;

      Object.assign(entrySpan, {
        traceId: `test_traceId_${idx}`,
        traceName: `test_name_${idx}`,
        duration: 500,
        startTime: Date.now(),
        tag: () => {}
      });

      traceManager.record(entrySpan, true);
    }

    expect(spy.callCount).to.equal(10);
    expect(spy.returned(true)).to.be.true;
    spy.restore();
  });

  it('should skip span when trace is timeout or dumped', () => {
    class Tracer extends EventEmitter {
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      tracer
    });

    const spy = sinon.spy((<any> traceManager).logger, 'warn');

    const fakeSpan = {
      traceId: 'test_traceId',
      traceName: 'test_name',
      duration: 500,
      startTime: Date.now(),
      tag: () => {}
    };

    traceManager.tracer.emit(SPAN_CREATED, fakeSpan);

    expect(spy.calledOnceWith('[TraceManager] trace maybe timeout and dumped, skip this span, please check!')).to.be.true;
    spy.restore();
  });

  it('should dump timeout trace data', async () => {
    class Tracer extends EventEmitter {
    }

    class Span extends EventEmitter {
      finish() {
        this.emit('span_finished', this);
      }
    }
    const tracer: any = new Tracer();
    const traceManager: TraceManager = new TraceManager({
      interval: 1000,
      timeout: 3000,
      tracer
    });

    traceManager.start();

    const entrySpanF: any = new Span;

    Object.assign(entrySpanF, {
      traceId: `test_traceId_1`,
      traceName: `test_name_1`,
      duration: 200,
      startTime: Date.now(),
      tag: () => {}
    });

    traceManager.record(entrySpanF, true);

    const entrySpanUF: any = new Span;

    Object.assign(entrySpanUF, {
      traceId: `test_traceId_2`,
      traceName: `test_name_2`,
      startTime: Date.now(),
      tag: () => {}
    });

    traceManager.record(entrySpanUF, true);

    await sleep(100);
    entrySpanF.finish();

    await new Promise((resolve) => {
      let finished = false;
      traceManager.on(TRACE_DATA_DUMP, (data) => {
        if (finished) resolve();
        const entry = data[0];

        if (entry) {
          const traceId = entry.getTraceId();

          if (traceId === 'test_traceId_1') {
            expect(data.length).to.be.equal(1);
            expect(entry.getStatus()).to.be.equal(TraceStatus.Normal);
          } else if (traceId === 'test_traceId_2') {
            expect(data.length).to.be.equal(1);
            expect(entry.getStatus()).to.be.equal(TraceStatus.Unfinished);
            expect(entry.getDuration()).to.gte(3000);
            finished = true;
          }
        }
      });
    });
  });

});
