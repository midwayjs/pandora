import {expect} from 'chai';
import {Tracer} from '../../../src/trace/Tracer';

describe('/test/unit/tracer.test.ts', () => {
  let tracer;
  let span;

  beforeEach(() => {
    tracer = new Tracer();
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
        ctx: {
          traceId: '123456',
          rpcId: '0.1'
        }
      });

      span.setTag('url', '/test');

      setTimeout(() => {
        const child = tracer.startSpan('hsf', {
          childOf: span,
          ctx: {
            traceId: '123456',
            rpcId: '0.0.1'
          }
        });
        child.setTag('service', 'com.taobao.hsf.test');
        child.log({state: 'waiting'});

        setTimeout(() => {
          child.log({state: 'done'});
          child.finish();
          span.finish();

          const report = tracer.report();

          expect(report.spans.length).to.equal(3);
          expect(report.spans[2].context.parentId).to.equal(report.spans[1].context.spanId);
          done();
        }, 500);
      }, 1000);
    });
  });
});
