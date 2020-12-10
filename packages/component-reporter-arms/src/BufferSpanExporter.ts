import { ExportResult } from '@opentelemetry/core';
import { ReadableSpan, SpanExporter } from '@opentelemetry/tracing';

export class BufferSpanExporter implements SpanExporter {
  private _finishedSpans: ReadableSpan[] = [];

  move(): ReadableSpan[] {
    const spans = this._finishedSpans;
    this._finishedSpans = [];
    return spans;
  }

  /**
   * Called to export sampled {@link ReadableSpan}s.
   * @param spans the list of sampled Spans to be exported.
   */
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    this._addToBuffer(spans);
    process.nextTick(() => resultCallback(ExportResult.SUCCESS));
  }

  /** @implements */
  async shutdown(): Promise<void> {}

  /** Add a span in the buffer. */
  private _addToBuffer(spans: ReadableSpan[]) {
    this._finishedSpans.push(...spans);
  }
}
