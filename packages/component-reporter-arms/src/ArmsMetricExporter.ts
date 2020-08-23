import {
  opentelemetryProto,
  ServiceClientType,
} from '@opentelemetry/exporter-collector/build/src/types';
import { CollectorExporterNodeBase } from '@opentelemetry/exporter-collector/build/src/platform/node/CollectorExporterNodeBase';
import { CollectorExporterConfigNode } from '@opentelemetry/exporter-collector/build/src/platform/node/types';

const DEFAULT_SERVICE_NAME = 'collector-metric-exporter';
const DEFAULT_COLLECTOR_URL_GRPC = 'localhost:55680';

/**
 * Arms Metric Exporter
 */
export class ArmsMetricExporter extends CollectorExporterNodeBase<
  opentelemetryProto.metrics.v1.ResourceMetrics,
  opentelemetryProto.collector.metrics.v1.ExportMetricsServiceRequest
> {
  // Converts time to nanoseconds
  protected readonly _startTime = new Date().getTime() * 1000000;

  convert(
    metrics: opentelemetryProto.metrics.v1.ResourceMetrics[]
  ): opentelemetryProto.collector.metrics.v1.ExportMetricsServiceRequest {
    return { resourceMetrics: metrics };
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
    return ServiceClientType.METRICS;
  }

  getServiceProtoPath(): string {
    return 'opentelemetry/proto/collector/metrics/v1/metrics_service.proto';
  }
}
