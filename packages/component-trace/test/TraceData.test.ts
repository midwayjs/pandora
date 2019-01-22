import {expect} from 'chai';
import {TraceData} from '../src/TraceData';
import {TraceStatus} from '../src/constants';

describe('TraceData', () => {

  it('should set and get traceId be ok', () => {

    const traceData = new TraceData();

    expect(traceData.getTraceId()).to.be.undefined;

    expect(() => {
      let undef;
      traceData.setTraceId(undef);
    }).to.be.throws('traceId should exist!');

    const expected = 'test_id';
    traceData.setTraceId(expected);
    expect(traceData.getTraceId()).to.be.equal(expected);

    expect(() => {
      traceData.setTraceId('whatever');
    }).to.be.throws('traceId already set!');

  });


  it('should set and get traceName be ok', () => {

    const traceData = new TraceData();

    expect(traceData.getTraceName()).to.be.undefined;

    expect(() => {
      let undef;
      traceData.setTraceName(undef);
    }).to.be.throws('traceName should exist!');

    const expected = 'test_str';
    traceData.setTraceName(expected);
    expect(traceData.getTraceName()).to.be.equal(expected);


    const expected2 = 'test_str_2';
    traceData.setTraceName(expected2);
    expect(traceData.getTraceName()).to.be.equal(expected2);

  });

  it('should set and get timestamp be ok', () => {

    const traceData = new TraceData();

    expect((Date.now() - traceData.getTimestamp()) < 10).to.be.ok;

    expect(() => {
      let undef;
      traceData.setTimestamp(undef);
    }).to.be.throws('timestamp should exist!');

    const expected = 123;
    traceData.setTimestamp(expected);
    expect(traceData.getTimestamp()).to.be.equal(expected);


    const expected2 = 456;
    traceData.setTimestamp(expected2);
    expect(traceData.getTimestamp()).to.be.equal(expected2);

  });

  it('should set and get duration be ok', () => {

    const traceData = new TraceData();

    expect(traceData.getDuration()).to.be.undefined;

    expect(() => {
      let undef;
      traceData.setDuration(undef);
    }).to.be.throws('duration should exist!');

    const expected = 123;
    traceData.setDuration(expected);
    expect(traceData.getDuration()).to.be.equal(expected);


    const expected2 = 456;
    traceData.setDuration(expected2);
    expect(traceData.getDuration()).to.be.equal(expected2);

  });

  it('should set and get status be ok', () => {

    const traceData = new TraceData();

    expect(traceData.getStatus()).to.be.equal(TraceStatus.Unfinished);

    expect(() => {
      let undef;
      traceData.setStatus(undef);
    }).to.be.throws('status should exist!');

    const expected = TraceStatus.Normal;
    traceData.setStatus(expected);
    expect(traceData.getStatus()).to.be.equal(expected);


    const expected2 = TraceStatus.Error;
    traceData.setStatus(expected2);
    expect(traceData.getStatus()).to.be.equal(expected2);

  });

  it('should putSpan() be ok', () => {

    const traceData = new TraceData();

    expect(traceData.getSpans()).to.deep.equal([]);

    expect(() => {
      let undef;
      traceData.putSpan(undef);
    }).to.be.throws('span should exist!');

    const expected = <any> {traceId: 'test'};
    traceData.putSpan(expected);
    expect(traceData.getSpans()).to.deep.equal([expected]);

  });

});
