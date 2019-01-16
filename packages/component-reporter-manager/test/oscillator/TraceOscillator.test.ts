import {TraceManager} from 'pandora-component-trace';
import {TraceOscillator} from '../../src/oscillator/TraceOscillator';
import {expect} from 'chai';
import {EventEmitter} from 'events';

const TRACE_DATA_DUMP = 'Trace:Data_Dump';

describe('TraceOscillator', () => {

  it('should proxy TRACE_DATA_DUMP event of TraceManager to event oscillate of TraceOscillator be ok', () => {
    const expectedData = ['test_content'];
    const fakeTraceManager: TraceManager = <any> new EventEmitter;
    const traceOscillator = new TraceOscillator(fakeTraceManager);
    let gotData;
    traceOscillator.on('oscillate', (data) => {
      gotData = data;
    });
    traceOscillator.start();
    fakeTraceManager.emit(TRACE_DATA_DUMP, expectedData);
    expect(gotData).to.be.equal(expectedData);
    traceOscillator.stop();
  });

  it('should avoid error be ok', () => {
    const fakeTraceManager: TraceManager = <any> new EventEmitter;
    const traceOscillator = new TraceOscillator(fakeTraceManager);
    traceOscillator.on('oscillate', (data) => {
      throw new Error('fakeError');
    });
    traceOscillator.start();
    fakeTraceManager.emit(TRACE_DATA_DUMP, []);
    traceOscillator.stop();
  });

});
