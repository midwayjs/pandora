import * as assert from 'assert';
import { IPandoraSpan } from './domain';
import { TraceStatus } from './constants';

export class TraceData {
  private traceId: string;
  private spans: IPandoraSpan[] = [];
  private timestamp: number = Date.now();
  private status: TraceStatus = TraceStatus.Unfinished;
  private traceName: string;
  private duration: number;

  setTraceId(traceId: string) {
    assert(traceId, 'traceId should exist!');
    assert(!this.traceId, 'traceId already set!');

    this.traceId = traceId;
  }

  getTraceId(): string {
    return this.traceId;
  }

  setTraceName(traceName: string) {
    assert(traceName, 'traceName should exist!');

    this.traceName = traceName;
  }

  getTraceName(): string {
    return this.traceName;
  }

  putSpan(span: IPandoraSpan) {
    assert(span, 'span should exist!');

    this.spans.push(span);
  }

  getSpans() {
    return this.spans;
  }

  setTimestamp(timestamp: number) {
    assert(timestamp, 'timestamp should exist!');

    this.timestamp = timestamp;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  setDuration(duration: number) {
    assert(duration != null, 'duration should exist!');

    this.duration = duration;
  }

  getDuration(): number {
    return this.duration;
  }

  setStatus(status: TraceStatus) {
    assert(status != null, 'status should exist!');

    this.status = status;
  }

  getStatus(): TraceStatus {
    return this.status;
  }

  isTimeout(timeout: number): boolean {
    const duration = Date.now() - this.timestamp;

    if (duration >= timeout) {
      this.setDuration(duration);
      return true;
    }

    return false;
  }
}