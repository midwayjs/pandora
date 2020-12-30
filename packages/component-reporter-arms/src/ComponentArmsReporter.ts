import { componentName, componentConfig } from '@pandorajs/component-decorator';
import { IndicatorManager } from '@pandorajs/component-indicator';
import ArmsIndicator, { ArmsBasicIndicator } from './ArmsIndicator';
import { Batcher } from '@opentelemetry/metrics';
import ArmsExportController from './ArmsExportController';
import { Resource } from '@opentelemetry/resources';
import { resolvePrimaryNetworkInterfaceIPv4Addr } from './util';
import SemanticTranslator from './SemanticTranslator';
import { ArmsMetaStringRegistry } from './ArmsMetaStringRegistry';
import { BufferSpanExporter } from './BufferSpanExporter';
import { TraceIdRatioBasedSampler } from '@pandorajs/component-trace';

export interface ArmsConfig {
  userId?: string;
  licenseKey?: string;
  serviceName?: string;
  endpoint: string;
  ip: string;
  interval?: number;
}

@componentName('reporterArms')
@componentConfig({
  arms: {
    interval: 15_000,
    ip: resolvePrimaryNetworkInterfaceIPv4Addr(),
  },
})
export default class ComponentArmsReporter {
  private ctx: any;
  private config: ArmsConfig;
  private armsIndicator: ArmsIndicator | ArmsBasicIndicator;

  private armsExportController?: ArmsExportController;

  constructor(ctx) {
    this.ctx = ctx;
    this.config = this.ctx.config.arms;
  }

  async start() {
    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;
    const batcher: Batcher = this.ctx.metricsBatcher;
    const sampler: TraceIdRatioBasedSampler = this.ctx.sampler;

    const bufferSpanExporter = new BufferSpanExporter();
    this.ctx.spanProcessor.addSpanExporter(bufferSpanExporter);

    this.armsIndicator = new ArmsBasicIndicator(
      batcher,
      sampler,
      bufferSpanExporter,
      indicatorManager,
      new Resource({
        'service.name': this.config.serviceName,
        'telemetry.sdk.language': 'nodejs',
        'host.ip': this.config.ip,
      })
    );
    indicatorManager.register(this.armsIndicator);
  }

  async startAtSupervisor() {
    this.armsExportController = new ArmsExportController(this.config);
    await this.armsExportController.register();
    const metaStringRegistry = new ArmsMetaStringRegistry(
      this.config.serviceName,
      this.armsExportController
    );
    const semanticTranslator = new SemanticTranslator(metaStringRegistry);

    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;
    const batcher: Batcher = this.ctx.metricsBatcher;
    const sampler: TraceIdRatioBasedSampler = this.ctx.sampler;

    const bufferSpanExporter = new BufferSpanExporter();
    this.ctx.spanProcessor.addSpanExporter(bufferSpanExporter);

    const armsIndicator = new ArmsIndicator(
      batcher,
      sampler,
      bufferSpanExporter,
      indicatorManager,
      semanticTranslator,
      new Resource({
        'service.name': this.config.serviceName,
        'telemetry.sdk.language': 'nodejs',
        'host.ip': this.config.ip,
      })
    );
    this.armsIndicator = armsIndicator;
    indicatorManager.register(this.armsIndicator);

    this.armsExportController.start(armsIndicator);
  }
}
