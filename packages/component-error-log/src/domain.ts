export interface ErrorLog {
  timestamp: number;
  method?: string;
  errType?: string;
  message?: string;
  stack?: string;
  traceId?: string;
  path?: string;
}

export interface ErrorLogManagerOptions {
  // 最多缓存数据数
  poolSize: number;
  // dump 数据周期，ms
  interval: number;
}
