import { initWithGrpc, resolvePrimaryNetworkInterfaceIPv4Addr } from './util';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { Resource } from '@opentelemetry/resources';
import * as os from 'os';
import { Metadata } from 'grpc';
import { ArmsRegisterClient, ServiceInstance } from './types';
import { ArmsMetricExporter } from './ArmsMetricExporter';
import ArmsIndicator from './ArmsIndicator';
import { CollectorProtocolNode } from '@opentelemetry/exporter-collector/build/src/enums';
import { ArmsConfig } from './ComponentArmsReporter';

export default class ArmsExportController {
  private client: ArmsRegisterClient;
  private authorization: string;

  private metricExporter: ArmsMetricExporter;

  constructor(
    private config: ArmsConfig,
    private armsIndicator: ArmsIndicator
  ) {
    this.authorization = Buffer.from(
      `${this.config.serviceName}:${this.config.licenseKey}`
    ).toString('base64');
  }

  async start() {
    this.client = await initWithGrpc(this.config.endpoint);
    const metadata = this.getAuthorizationMetadata();

    await this.registerServiceInstance(
      {
        resource: toCollectorResource(
          new Resource({
            'host.name': os.hostname(),
            'host.ip': this.config.ip,
            'service.name': this.config.serviceName,
            'telemetry.sdk.language': 'nodejs',
          })
        ),
        startTimestamp: Date.now(),
      },
      metadata
    );

    this.metricExporter = new ArmsMetricExporter({
      protocolNode: CollectorProtocolNode.GRPC,
      url: this.config.endpoint,
      metadata: this.getAuthorizationMetadata(),
    });

    setInterval(async () => {
      const resourceMetric = await this.armsIndicator.getResourceMetrics();
      if (
        resourceMetric.instrumentationLibraryMetrics.length === 0 ||
        resourceMetric.instrumentationLibraryMetrics.reduce(
          (curr, it) => ((curr += it.metrics.length), curr),
          0
        ) === 0
      ) {
        return;
      }
      this.metricExporter.send(
        [resourceMetric],
        () => {
          console.info('collector metric exported');
        },
        error => {
          console.error('collector errror', error);
        }
      );
    }, 1000 /** 1min */);
  }

  getAuthorizationMetadata() {
    const metadata = new Metadata();
    metadata.set('Authorization', `Basic ${this.authorization}`);
    return metadata;
  }

  private registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: Metadata
  ) {
    return new Promise((resolve, reject) => {
      this.client.registerServiceInstance(
        serviceInstance,
        metadata,
        (error, response) => {
          if (error != null || !response.success) {
            return reject(error || new Error(response.msg));
          }
          resolve();
        }
      );
    });
  }
}
