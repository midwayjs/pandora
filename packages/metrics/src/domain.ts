/**
 * 指标分类
 */

import {EndPointService} from './service/EndPointService';
import {MetricsManager} from './common/MetricsManager';

export interface IEndPoint {
  indicators: Array<IIndicator>;
  group: string;
  initialize();
  setLogger(logger);
  destory();

  /**
   * 调用名下指标
   * @param args
   */
  invoke(args?);

  /**
   * 处理查询返回结果
   */
  processQueryResults(results?: Array<IIndicatorResult>): any;
}

/**
 * 单个指标
 */
export interface IIndicator {
  appName: string;
  group: string;
  invoke(data?: any, builder?: IBuilder);
  destory();
}

/**
 * 指标构建工具
 */
export interface IBuilder {
  withDetail(key: string, data: any, scope?: IndicatorScope | string): IBuilder;
  getDetails(): Array<IndicatorBuilderResult>;
  pretty(format: string, value);
  setPrettyMode(prettyMode: boolean);
}

/**
 * builder 构建完单个指标的结果
 */
export interface IndicatorBuilderResult {
  key: string;
  data: any;
  scope: IndicatorScope;
}

/**
 * Indicator 最后输出的指标
 */
export interface IndicatorResultObject {
  key: string;
  data: any;
  scope: IndicatorScope;
}

/**
 *  Endpoint 中聚合指标的结果
 */
export interface IIndicatorResult {
  setErrorMessage(err: Error);
  setResult(results: Array<IndicatorBuilderResult>);
}

export type IndicatorType = 'singleton' | 'multiton';

export interface Invokable {
  invoke(args?);
}

export interface LoggerOptions {
  method: string;
  from: string;
  errType: string;
  message: string;
  stack: string;
}

/**
 * 健康检查状态
 */
export enum HealthIndicatorStatus {
  UP = 'UP',
  DOWN = 'DOWN'
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
 * 指标结果状态
 */
export enum IndicatorResultStatus {
  DEFAULT = -1,
  SUCCESS = 0,
  FAIL = 1,
}

/**
 * 代理创建新 metric 的消息
 */
export interface ProxyCreateMessage {
  action: string;
  name: string;
  type: string;
  group: string;
}

/**
 * 代理更新 metric 的消息
 */
export interface ProxyUpdateMessage {
  action: string;
  name: string;
  method: string;
  value: any;
  type: string;
}

export interface Reporter {
  start(intervalInMs?: number);
  stop();
}

export interface ActuatorResource {
  prefix: string;
  route(routers);
}

export interface ActuatorServer {
  getMetricsManager(): MetricsManager;
  getEndPointService(): EndPointService;
}

export interface ActuatorService {
  start();
  stop();
}

export interface IPatcher {
  hook(version: string, reply: () => {});
  getShimmer();
  getHook();
  getTraceManager();
  getModuleName();
  getSender();
  run();
}

export interface LoggerCollector {
  collect(method, reply: (paload: LoggerOptions) => void);
}

export interface SpanData {
  name: string;
  references: Array<{
    refType: string;
    traceId: string;
    spanId: string;
  }>;
  context: object;
  timestamp: number;
  duration: number;
  logs: Array<{
    timestamp: string;
    fields: any;
  }>;
  tags: object;
}

export interface TraceData {
  duration: number;
  spans: Array<SpanData>;
}

export interface TracerReport {
  report();
  getValue();
}
