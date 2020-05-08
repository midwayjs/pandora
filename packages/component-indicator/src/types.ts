/**
 * 单个指标
 */
export interface IIndicator {
  group: string;
  key?: string;
  scope?: IndicatorScope;
  invoke(query: any): Promise<any>;
}

/**
 * 指标维度
 */
export enum IndicatorScope {
  SYSTEM = 'SYSTEM',
  APP = 'APP',
  PROCESS = 'PROCESS',
}

/**
 * Indicator 最后输出的指标
 */
export interface IndicatorResultObject {
  appName: string;
  pid: string;
  group: string;
  key: string;
  data: any;
  scope: IndicatorScope;
}
