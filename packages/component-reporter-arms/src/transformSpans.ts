import { ReadableSpan } from '@opentelemetry/tracing';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import { Resource } from '@opentelemetry/resources';
import { InstrumentationLibrary } from '@opentelemetry/core';
import {
  toCollectorResource,
  toCollectorSpan,
} from '@opentelemetry/exporter-collector/build/src/transform';
import { Attributes } from '@opentelemetry/api';

/**
 * Returns a list of resource spans which will be exported to the collector
 * @param groupedSpans
 * @param baseAttributes
 */
export function toCollectorResourceSpans(
  groupedSpans: Map<Resource, Map<InstrumentationLibrary, ReadableSpan[]>>,
  baseAttributes: Attributes
): opentelemetryProto.trace.v1.ResourceSpans[] {
  return Array.from(groupedSpans, ([resource, libSpans]) => {
    return {
      resource: toCollectorResource(resource, baseAttributes),
      instrumentationLibrarySpans: Array.from(
        libSpans,
        ([instrumentationLibrary, spans]) =>
          toCollectorInstrumentationLibrarySpans(instrumentationLibrary, spans)
      ),
    };
  });
}

/**
 * Convert to InstrumentationLibrarySpans
 * @param instrumentationLibrary
 * @param spans
 */
function toCollectorInstrumentationLibrarySpans(
  instrumentationLibrary: InstrumentationLibrary,
  spans: ReadableSpan[]
): opentelemetryProto.trace.v1.InstrumentationLibrarySpans {
  return {
    spans: spans.map(toCollectorSpan),
    instrumentationLibrary,
  };
}
