import { IndicatorManager } from './IndicatorManager';
import { IndicatorResultObject } from './types';

export class IndicatorManagerProxy {
  static SERVICE_NAME_AT_IPC_HUB = '__Pandora__IndicatorManagerProxy';
  indicatorManager: IndicatorManager;
  constructor(indicatorManager: IndicatorManager) {
    this.indicatorManager = indicatorManager;
  }
  overProcessCallHandle(
    indicatorGroup: string,
    query: any
  ): Promise<IndicatorResultObject[]> {
    return this.indicatorManager.invokeRaw(indicatorGroup, query);
  }
}
