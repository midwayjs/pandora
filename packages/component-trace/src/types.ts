import * as tracing from '@opentelemetry/tracing';

/**
 * SpanProcessor is the interface Tracer SDK uses to allow synchronous hooks
 * for when a {@link Span} is started or when a {@link Span} is ended.
 */
export interface SpanProcessor {
  /**
   * Forces to export all finished spans
   */
  forceFlush(): void;
  /**
   * Called when a {@link Span} is started, if the `span.isRecording()`
   * returns true.
   * @param span the Span that just started.
   */
  onStart(span: tracing.ReadableSpan): void;
  /**
   * Called when a {@link Span} is ended, if the `span.isRecording()`
   * returns true.
   * @param span the Span that just ended.
   */
  onEnd(span: tracing.ReadableSpan): void;
  /**
   * Shuts down the processor. Called when SDK is shut down. This is an
   * opportunity for processor to do any cleanup required.
   */
  shutdown(): void;
}
