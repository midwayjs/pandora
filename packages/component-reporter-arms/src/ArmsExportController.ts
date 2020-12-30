import { initWithGrpc, sum } from './util';
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
import { ArmsTraceExporter } from './ArmsTraceExporter';
import ControlChannel, { ControlConfig } from './ControlChannel';

const debug = createDebug('pandora:arms');

export default class ArmsExportController {
  /**
   * @internal
   */
  serviceRegister: ArmsServiceRegister;
  metadataRegister: ArmsMetaDataRegister;
  private authorization: string;

  private metricExporter: ArmsMetricExporter;
  private traceExporter: ArmsTraceExporter;
  private controlChannel = new ControlChannel();

  private startTimestamp = Date.now();
  private registrationTimer: ReturnType<typeof setInterval>;
  private collectionTimer: ReturnType<typeof setInterval>;

  private registered = false;

  constructor(private config: ArmsConfig) {
    this.authorization = Buffer.from(
      `${this.config.userId}:${this.config.licenseKey}`
    ).toString('base64');

    this.metricExporter = new ArmsMetricExporter({
      url: this.config.endpoint,
      metadata: this.getAuthorizationMetadata(),
    });
    this.traceExporter = new ArmsTraceExporter({
      url: this.config.endpoint,
      metadata: this.getAuthorizationMetadata(),
    });
  }

  async register() {
    [this.serviceRegister, this.metadataRegister] = await initWithGrpc(
      this.config.endpoint
    );
    this.registerServiceInstance().catch(e => {
      debug('arms registration failed', e);
    });

    clearInterval(this.registrationTimer);
    this.registrationTimer = setInterval(
      () =>
        this.registerServiceInstance().catch(e => {
          debug('arms registration failed', e);
        }),
      60_000 /** 1min */
    );
  }

  start(armsIndicator: ArmsIndicator) {
    this.controlChannel.addListener(
      'data',
      this.controlChannelUpdate.bind(this, armsIndicator)
    );

    clearInterval(this.collectionTimer);
    this.collectionTimer = setInterval(async () => {
      this.collect(armsIndicator);
    }, this.config.interval ?? 15_000 /** 15s */);
  }

  stop() {
    clearInterval(this.registrationTimer);
    clearInterval(this.collectionTimer);
  }

  registerBatchStringMeta(batchStringMeta: BatchStringMeta) {
    if (!this.registered) {
      return Promise.reject(new Error('arms registration not complete yet'));
    }
    return new Promise<void>((resolve, reject) => {
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

  private async registerServiceInstance() {
    const pid = await new Promise<string>((resolve, reject) => {
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
          debug(
            'register service instance result(error: %s, response: %s)',
            error,
            response
          );
          if (error != null || !response.success) {
            this.registered = false;
            return reject(error || new Error(response.msg));
          }
          this.registered = true;
          resolve(response.pid);
        }
      );
    });

    await this.controlChannel.updateCredential(pid);
  }

  private async controlChannelUpdate(
    armsIndicator: ArmsIndicator,
    data: ControlConfig
  ) {
    if (data.profiler.sampling) {
      armsIndicator.setSampling(
        data.profiler.sampling.enable,
        data.profiler.sampling.rate
      );
    }
  }

  private async collect(armsIndicator: ArmsIndicator) {
    if (!this.registered) {
      return;
    }
    await Promise.all([
      this.collectMetrics(armsIndicator),
      this.collectTraceSpans(armsIndicator),
    ]);
  }

  private async collectMetrics(armsIndicator: ArmsIndicator) {
    const resourceMetric = await armsIndicator.getResourceMetrics();
    if (
      sum(
        resourceMetric.instrumentationLibraryMetrics,
        it => it.metrics.length
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

  private async collectTraceSpans(armsIndicator: ArmsIndicator) {
    const resourceSpans = await armsIndicator.getResourceSpans();
    if (
      sum(resourceSpans, it =>
        sum(it.instrumentationLibrarySpans, it => it.spans.length)
      ) === 0
    ) {
      debug('no spans collected, skipping');
      return;
    }
    this.traceExporter.send(
      resourceSpans,
      () => {
        debug('collector span exported');
      },
      error => {
        debug('collector error', error);
      }
    );
  }
}
