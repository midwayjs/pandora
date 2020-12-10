import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import { CollectorExporterNodeBase } from '@opentelemetry/exporter-collector-grpc/build/src/CollectorExporterNodeBase';
import {
  ServiceClientType,
  CollectorExporterConfigNode,
} from '@opentelemetry/exporter-collector-grpc/build/src/types';

const DEFAULT_SERVICE_NAME = 'collector-metric-exporter';
const DEFAULT_COLLECTOR_URL_GRPC = 'localhost:55680';

/**
 * Arms Metric Exporter
 */
export class ArmsTraceExporter extends CollectorExporterNodeBase<
  opentelemetryProto.trace.v1.ResourceSpans,
  opentelemetryProto.collector.trace.v1.ExportTraceServiceRequest
> {
  // Converts time to nanoseconds
  protected readonly _startTime = new Date().getTime() * 1000000;

  convert(
    items: opentelemetryProto.trace.v1.ResourceSpans[]
  ): opentelemetryProto.collector.trace.v1.ExportTraceServiceRequest {
    return { resourceSpans: items };
  }

  getDefaultUrl(config: CollectorExporterConfigNode): string {
    if (!config.url) {
      return DEFAULT_COLLECTOR_URL_GRPC;
    }
    return config.url;
  }

  getDefaultServiceName(config: CollectorExporterConfigNode): string {
    return config.serviceName || DEFAULT_SERVICE_NAME;
  }

  getServiceClientType() {
    return ServiceClientType.SPANS;
  }

  getServiceProtoPath(): string {
    return 'opentelemetry/proto/collector/trace/v1/trace_service.proto';
  }
}
