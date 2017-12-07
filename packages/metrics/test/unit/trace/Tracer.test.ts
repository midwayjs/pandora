import {expect} from 'chai';
import {Tracer} from '../../../src/trace/Tracer';

describe('/test/unit/Tracer.test.ts', () => {
  let tracer;
  let span;

  beforeEach(() => {
    tracer = new Tracer({
      traceId: '123456'
    });
    tracer.setAttr('name', 'TestTracer');
    span = tracer.startSpan('test-span');
  });

  describe('Tracer', () => {
    it('should be a class', () => {
      expect(new Tracer()).to.be.an('object');
    });
  });

  describe('Span', () => {
    it('should be a class', () => {
      expect(span).to.be.an('object');
    });
  });

  describe('SpanContext', () => {
    it('should be a class', () => {
      const spanContext = span.context();
      expect(spanContext).to.be.an('object');
    });
  });

  describe('Child Span', () => {
    it('should handle child span', () => {
      expect(() => {
        tracer.startSpan('child', {childOf: span});
      }).to.not.throw(Error);
    });
  });

  describe('Tracer Integrate Test', () => {
    it('should record spans', (done) => {
      span = tracer.startSpan('http', {
        traceId: '123456',
        customCtx: 'test'
      });

      span.setTag('url', '/test');

      setTimeout(() => {
        const child = tracer.startSpan('hsf', {
          childOf: span,
          traceId: '123456'
        });
        child.setTag('service', 'com.taobao.hsf.test');
        child.log({state: 'waiting'});

        setTimeout(() => {
          child.log({state: 'done'});
          child.finish();
          span.finish();

          const report = tracer.report();

          expect(report.name).to.equal('TestTracer');
          expect(report.spans.length).to.equal(3);
          expect(report.spans[2].context.parentId).to.equal(report.spans[1].context.spanId);
          expect(report.spans[1].context.customCtx).to.equal('test');
          done();
        }, 500);
      }, 1000);
    });
  });
});
