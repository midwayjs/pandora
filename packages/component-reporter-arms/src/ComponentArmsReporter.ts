import { componentName, componentConfig } from '@pandorajs/component-decorator';
import { IndicatorManager } from '@pandorajs/component-indicator';
import ArmsIndicator from './ArmsIndicator';
import { Batcher } from '@opentelemetry/metrics';
import ArmsExportController from './ArmsExportController';
import { Resource } from '@opentelemetry/resources';
import { resolvePrimaryNetworkInterfaceIPv4Addr } from './util';

export interface ArmsConfig {
  licenseKey: string;
  serviceName: string;
  endpoint: string;
  ip: string;
}

@componentName('reporterArms')
export default class ComponentArmsReporter {
  private ctx: any;
  private config: ArmsConfig;
  private armsIndicator: ArmsIndicator;

  private armsExportController: ArmsExportController;

  constructor(ctx) {
    this.ctx = ctx;
    this.config = this.ctx.config.arms;
  }

  async start() {
    this.startAtAllProcesses();
  }

  async startAtSupervisor() {
    this.startAtAllProcesses();
    this.armsExportController = new ArmsExportController(
      this.config,
      this.armsIndicator
    );
    await this.armsExportController.start();
  }

  startAtAllProcesses() {
    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;
    const batcher: Batcher = this.ctx.metricsBatcher;
    this.armsIndicator = new ArmsIndicator(
      batcher,
      indicatorManager,
      new Resource({
        'service.name': this.config.serviceName,
        'telemetry.sdk.language': 'nodejs',
        'host.ip': this.config.ip,
      })
    );
    indicatorManager.register(this.armsIndicator);
  }
}
