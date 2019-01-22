import {expect} from 'chai';
import {TraceIndicator} from '../src/TraceIndicator';
import {TraceManager} from '../src/TraceManager';
import {EventEmitter} from 'events';
import {SPAN_FINISHED} from '../src/constants';

describe('TraceIndicator', () => {

  it('should listTrace() be ok', async () => {

    const traceManager: TraceManager = new TraceManager;
    const traceIndicator = new TraceIndicator(traceManager);

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
      entrySpan.emit(SPAN_FINISHED, entrySpan);
    }

    // all
    const res = await traceIndicator.listTrace({});
    expect(res.length).to.be.equal(6);

    // filter by traceId
    const res2 = await traceIndicator.listTrace({
      traceId: 'test_traceId_2'
    });
    expect(res2.length).to.be.equal(1);
    expect(res2[0]).to.deep.include({
      traceId: 'test_traceId_2'
    });

    // filter by traceName
    const res3 = await traceIndicator.listTrace({
      traceName: 'test_name_1'
    });
    expect(res3.length).to.be.equal(1);
    expect(res3[0]).to.deep.include({
      traceName: 'test_name_1'
    });

  });

  it('should pass to listTrace() over invoke() interface', async () => {
    const traceManager: TraceManager = new TraceManager;
    const traceIndicator = new TraceIndicator(traceManager);

    const query = {
      traceName: 'testName'
    };
    let got = null;
    (<any> traceIndicator).listTrace = (query) => {
      got = query;
      return ['test_result'];
    };
    const ret = await traceIndicator.invoke(query);
    expect(got).to.deep.equal(query);
    expect(ret).to.deep.equal(['test_result']);

  });

});
