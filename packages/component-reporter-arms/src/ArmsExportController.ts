import { initWithGrpc } from './util';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { Resource } from '@opentelemetry/resources';
import * as os from 'os';
import { Metadata } from 'grpc';
import {
  ArmsMetaDataRegister,
  ArmsServiceRegister,
  BatchStringMeta,
} from './types';
import ArmsIndicator from './ArmsIndicator';
import { ArmsConfig } from './ComponentArmsReporter';
import * as createDebug from 'debug';
import { ArmsMetricExporter } from './ArmsMetricExporter';

const debug = createDebug('pandora:arms');

export default class ArmsExportController {
  /**
   * @internal
   */
  serviceRegister: ArmsServiceRegister;
  metadataRegister: ArmsMetaDataRegister;
  private authorization: string;

  private metricExporter: ArmsMetricExporter;

  private startTimestamp = Date.now();
  private registrationTimer: ReturnType<typeof setInterval>;
  private collectionTimer: ReturnType<typeof setInterval>;

  constructor(private config: ArmsConfig) {
    this.authorization = Buffer.from(
      `${this.config.serviceName}@nodejs:${this.config.licenseKey}`
    ).toString('base64');
  }

  async register() {
    [this.serviceRegister, this.metadataRegister] = await initWithGrpc(
      this.config.endpoint
    );
    await this.registerServiceInstance();
    this.registrationTimer = setInterval(
      () => this.registerServiceInstance(),
      60_000 /** 1min */
    );

    this.metricExporter = new ArmsMetricExporter({
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
      this.metadataRegister.registerBatchStringMeta(
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
      this.serviceRegister.registerServiceInstance(
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
    await Promise.all([this.collectMetrics(armsIndicator)]);
  }

  private async collectMetrics(armsIndicator: ArmsIndicator) {
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
