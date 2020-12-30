import ArmsIndicator from '../src/ArmsIndicator';
import { TestMeterProvider } from 'test-util';
import { IndicatorManager } from '@pandorajs/component-indicator';
import * as sinon from 'sinon';
import {
  RpcMetric,
  GeneralAttribute,
  HttpAttribute,
} from '@pandorajs/semantic-conventions';
import * as assert from 'assert';
import { ValueType } from '@opentelemetry/api';
import SemanticTranslator from '../src/SemanticTranslator';
import { ArmsMetaStringRegistry } from '../src/ArmsMetaStringRegistry';
import { TestArmsExportController } from './util';
import { BufferSpanExporter } from '../src/BufferSpanExporter';
import { TraceIdRatioBasedSampler } from '@pandorajs/component-trace';

describe('ArmsIndicator', () => {
  const semanticTranslator = new SemanticTranslator(
    new ArmsMetaStringRegistry('foo', new TestArmsExportController())
  );
  describe('aggregation', () => {
    it('should aggregate int64 data point', async () => {
      const indicatorManager = new IndicatorManager({});
      const meterProvider1 = new TestMeterProvider();
      const sampler = new TraceIdRatioBasedSampler();
      const spanExporter = new BufferSpanExporter();
      const indicator1 = new ArmsIndicator(
        meterProvider1.batcher,
        sampler,
        spanExporter,
        indicatorManager,
        semanticTranslator
      );
      const meterProvider2 = new TestMeterProvider();
      const indicator2 = new ArmsIndicator(
        meterProvider2.batcher,
        sampler,
        spanExporter,
        indicatorManager,
        semanticTranslator
      );
      const stub = sinon.stub(indicatorManager, 'invokeAllProcesses');
      stub.callsFake((async (group, action) => {
        const result = await Promise.all(
          [indicator1, indicator2].map(it => it.invoke(action))
        );
        return result.map(data => ({
          data,
        }));
      }) as any);

      await Promise.all(
        [meterProvider1, meterProvider2].map(async meterProvider => {
          const meter = meterProvider.getMeter('test');
          const counter = meter.createCounter(RpcMetric.REQUEST_COUNT, {
            valueType: ValueType.INT,
          });
          counter.add(1, {
            [GeneralAttribute.COMPONENT]: 'http',
            [HttpAttribute.HTTP_METHOD]: 'GET',
            [HttpAttribute.HTTP_ROUTE]: '/',
            [HttpAttribute.HTTP_STATUS_CODE]: '200',
          });

          await meter.collect();
        })
      );

      const result = await indicator1.getResourceMetrics();
      assert.strictEqual(result.instrumentationLibraryMetrics.length, 1);
      assert.strictEqual(
        result.instrumentationLibraryMetrics[0].metrics.length,
        1
      );
      const metric = result.instrumentationLibraryMetrics[0].metrics[0];
      assert.strictEqual(metric.name, 'arms_http_requests_by_status_total');
      assert.strictEqual(metric.intGauge.dataPoints.length, 1);
      const dp = metric.intGauge.dataPoints[0];
      assert.deepStrictEqual(dp.labels, [
        {
          key: 'rpc',
          value: 'GET /',
        },
        {
          key: 'status',
          value: '200',
        },
      ]);
      /**
       * TestBatcher > LastValueAggregator
       */
      assert.deepStrictEqual(dp.value, 1);
    });
  });
});
