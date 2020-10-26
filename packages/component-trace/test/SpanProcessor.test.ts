import { MultiSpanProcessor } from '../src/SpanProcessor';
import { ConsoleSpanExporter } from '@opentelemetry/tracing';
import * as assert from 'assert';

describe('SpanProcessor', () => {
  it('should add/remove exporters', () => {
    const spanProcessor = new MultiSpanProcessor();
    const exporter = new ConsoleSpanExporter();

    spanProcessor.addSpanExporter(exporter);
    assert.strictEqual(spanProcessor['_spanExporter'].length, 1);
    spanProcessor.removeSpanExporter(exporter);
    assert.strictEqual(spanProcessor['_spanExporter'].length, 0);
  });
});
