import {expect} from 'chai';
import {TraceManager} from '../src/TraceManager';
import {EventEmitter} from 'events';
import {SPAN_FINISHED, TRACE_DATA_DUMP, TraceStatus} from '../src/constants';


describe('TraceManager', () => {

  it('should construct without tracer be ok', () => {
    const traceManager: TraceManager = new TraceManager();
    expect(traceManager.tracer).to.be.undefined;
  });

  it('should construct without tracer be ok', () => {

    class Tracer extends EventEmitter {
    }

    const traceManager: TraceManager = new TraceManager({
      kTracer: <any> Tracer
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
      interval: 10,
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

    await new Promise(resolve => {
      setTimeout(resolve, 20);
    });

    expect(gotDump.length).to.be.equal(1);

    traceManager.stop();
    traceManager.stop();

  });

});
