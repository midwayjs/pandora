/*!
 * Copyright 2019, OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  SpanProcessor,
  SpanExporter,
  ReadableSpan,
} from '@opentelemetry/tracing';

/**
 * Implementation of the {@link SpanProcessor} that simply forwards all
 * received events to a list of {@link SpanExporter}s.
 */
export class MultiSpanProcessor implements SpanProcessor {
  private _spanExporter: SpanExporter[] = [];
  constructor() {}

  addSpanExporter(spanExporter: SpanExporter) {
    this._spanExporter.push(spanExporter);
  }

  removeSpanExporter(spanExporter: SpanExporter) {
    const idx = this._spanExporter.indexOf(spanExporter);
    if (idx < 0) {
      return;
    }
    this._spanExporter.splice(idx, 1);
  }

  async forceFlush(): Promise<void> {
    // TODO:
  }

  onStart(span: ReadableSpan): void {
    // TODO:
  }

  onEnd(span: ReadableSpan): void {
    const callback = () => {};
    for (const exporter of this._spanExporter) {
      exporter.export([span], callback);
    }
  }

  async shutdown(): Promise<void> {
    for (const exporter of this._spanExporter) {
      exporter.shutdown();
    }
  }
}
