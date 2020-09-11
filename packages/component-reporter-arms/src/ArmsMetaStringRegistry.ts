import { crc32 } from 'crc';
import { BatchStringMeta } from './types';
import { toCollectorResource } from '@opentelemetry/exporter-collector/build/src/transform';
import { Resource } from '@opentelemetry/resources';
import * as createDebug from 'debug';
import ArmsExportController from './ArmsExportController';

const debug = createDebug('pandora:arms');
const BUFFER_SIZE = 10;

export class ArmsMetaStringRegistry {
  private registeredIds: Set<string> = new Set();
  private pendingIds: Set<string> = new Set();
  private registeringIds: Set<string> = new Set();
  private pendingStringMeta: [string, string][] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    private serviceName: string,
    private exportController: ArmsExportController,
    private bufferSize = BUFFER_SIZE
  ) {}

  public getMetaIdForString(str: string): string {
    const id = crc32(str).toString(16);
    this.registerId(id, str);
    return id;
  }

  private registerId(id: string, str: string) {
    if (this.registeredIds.has(id)) {
      return;
    }
    if (this.registeringIds.has(id)) {
      return;
    }
    if (this.pendingIds.has(id)) {
      return;
    }
    this.pendingIds.add(id);
    this.pendingStringMeta.push([id, str]);

    this.registerBatch();
  }

  private registerBatch() {
    debug('[MetaString] register batch');
    if (
      this.pendingIds.size >= this.bufferSize &&
      this.registeringIds.size === 0
    ) {
      this.doRegisterBatch();
      return;
    }

    this.timer = setTimeout(() => {
      this.doRegisterBatch();
      this.timer = null;
    }, 1000);
  }

  private async doRegisterBatch() {
    clearTimeout(this.timer);
    this.timer = null;

    const pendingStringMeta = this.pendingStringMeta;
    this.pendingStringMeta = [];
    this.registeringIds = this.pendingIds;
    this.pendingIds = new Set();

    const batchStringMeta: BatchStringMeta = {
      resource: toCollectorResource(
        new Resource({
          'service.name': this.serviceName,
          'telemetry.sdk.language': 'nodejs',
        })
      ),
      metas: pendingStringMeta.map(it => ({
        key: it[0],
        value: it[1],
      })),
    };

    debug('[MetaString] do register batch: %d', pendingStringMeta.length);
    try {
      await this.exportController.registerBatchStringMeta(batchStringMeta);
    } catch (e) {
      debug('[MetaString] register batch result', e);
      this.mergePendings(pendingStringMeta);
      return;
    }
    for (const id of this.registeringIds.values()) {
      this.registeredIds.add(id);
    }
    this.registeringIds = new Set();
  }

  private mergePendings(pendingStringMeta: [string, string][]) {
    for (const item of pendingStringMeta) {
      if (this.pendingIds.has(item[0])) {
        continue;
      }
      this.pendingIds.add(item[0]);
      this.pendingStringMeta.push(item);
    }
  }
}
