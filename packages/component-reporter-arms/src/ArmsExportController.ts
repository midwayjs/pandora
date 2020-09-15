import { initWithGrpc } from './util';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { Resource } from '@opentelemetry/resources';
import * as os from 'os';
import { Metadata } from 'grpc';
import { ArmsRegisterClient, BatchStringMeta, ServiceInstance } from './types';
import { ArmsMetricExporter } from './ArmsMetricExporter';
import ArmsIndicator from './ArmsIndicator';
import { CollectorProtocolNode } from '@opentelemetry/exporter-collector/build/src/enums';
import { ArmsConfig } from './ComponentArmsReporter';
import * as createDebug from 'debug';

const debug = createDebug('pandora:arms');

export default class ArmsExportController {
  /**
   * @internal
   */
  client: ArmsRegisterClient;
  private authorization: string;

  private metricExporter: ArmsMetricExporter;

  private startTimestamp = Date.now();
  private registrationTimer: ReturnType<typeof setInterval>;
  private collectionTimer: ReturnType<typeof setInterval>;

  constructor(private config: ArmsConfig) {
    this.authorization = Buffer.from(
      `${this.config.serviceName}:${this.config.licenseKey}`
    ).toString('base64');
  }

  async register() {
    this.client = await initWithGrpc(this.config.endpoint);
    await this.registerServiceInstance();
    this.registrationTimer = setInterval(
      () => this.registerServiceInstance(),
      60_000 /** 1min */
    );

    this.metricExporter = new ArmsMetricExporter({
      protocolNode: CollectorProtocolNode.GRPC,
      url: this.config.endpoint,
      metadata: this.getAuthorizationMetadata(),
    });
  }

  start(armsIndicator: ArmsIndicator) {
    this.collectionTimer = setInterval(async () => {
      this.collect(armsIndicator);
    }, this.config.interval ?? 15_000 /** 15s */);
  }

  stop() {
    clearInterval(this.registrationTimer);
    clearInterval(this.collectionTimer);
  }

  registerBatchStringMeta(batchStringMeta: BatchStringMeta) {
    return new Promise((resolve, reject) => {
      this.client.registerBatchStringMeta(
        batchStringMeta,
        this.getAuthorizationMetadata(),
        (error, response) => {
          if (error != null || !response.success) {
            return reject(error || new Error(response.msg));
          }
          resolve();
        }
      );
    });
  }

  private getAuthorizationMetadata() {
    const metadata = new Metadata();
    metadata.set('Authorization', `Basic ${this.authorization}`);
    return metadata;
  }

  private registerServiceInstance() {
    return new Promise((resolve, reject) => {
      this.client.registerServiceInstance(
        {
          resource: toCollectorResource(
            new Resource({
              'host.name': os.hostname(),
              'host.ip': this.config.ip,
              'service.name': this.config.serviceName,
              'telemetry.sdk.language': 'nodejs',
            })
          ),
          startTimestamp: this.startTimestamp,
        },
        this.getAuthorizationMetadata(),
        (error, response) => {
          if (error != null || !response.success) {
            return reject(error || new Error(response.msg));
          }
          resolve();
        }
      );
    });
  }

  private async collect(armsIndicator: ArmsIndicator) {
    const resourceMetric = await armsIndicator.getResourceMetrics();
    debug('collected metrics', resourceMetric);
    if (
      resourceMetric.instrumentationLibraryMetrics.length === 0 ||
      resourceMetric.instrumentationLibraryMetrics.reduce(
        (curr, it) => ((curr += it.metrics.length), curr),
        0
      ) === 0
    ) {
      debug('no metrics collected, skipping');
      return;
    }
    this.metricExporter.send(
      [resourceMetric],
      () => {
        debug('collector metric exported');
      },
      error => {
        debug('collector error', error);
      }
    );
  }
}
