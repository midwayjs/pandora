import { EventEmitter } from 'events';
import { IPandoraSpan } from 'pandora-component-trace';
import { IncomingMessage, ServerResponse } from 'http';

export type OriginalModule = any;
export type WrappedModule = any;
export type ShimmerWrapper = (original: OriginalModule, name: string) => WrappedModule;

export interface IShimmer {
  wrap: (nodule: OriginalModule, name: string, wrapper: ShimmerWrapper) => WrappedModule;
  massWrap: (nodules: OriginalModule | OriginalModule[], names: string[], wrapper: ShimmerWrapper) => void;
  unwrap: (nodule: WrappedModule, name: string) => OriginalModule;
  massUnwrap: (nodules: WrappedModule | WrappedModule[], names: string[]) => void;
}

export interface ICLSContext extends Object {
  _ns_name: string;
  id: number;
}

export type CLSContextValue = any;
export type CLSBindFunction = Function;

export interface ICLSNamespace {
  name: string;
  active: ICLSContext;
  _set: ICLSContext[];
  id: number;
  _contexts: Map<number, ICLSContext>;
  _indent: number;

  set: (key: string | number, value: CLSContextValue) => CLSContextValue;
  get: (key: string | number) => CLSContextValue;
  createContext: () => ICLSContext;
  run: (fn: Function) => void;
  runAndReturn: (fn: Function) => any;
  runPromise: (fn: Function) => any;
  bind: (fn: Function, context?: ICLSContext) => CLSBindFunction;
  enter: (context: ICLSContext) => void;
  exit: (context: ICLSContext) => void;
  bindEmitter: (emitter: EventEmitter) => void;
  fromException: (exception: Error) => any;
}

export interface PatcherOptions {
  enabled: boolean;
}

export type CustomTraceName = (tags: HttpServerTags) => string;
export type RequestFilter = (req: IncomingMessage) => boolean;
export type BodyTransformer = (buffer: Buffer, req?: IncomingMessage) => string;

export interface HttpServerPatcherOptions extends PatcherOptions {
  // 是否记录 search 参数
  recordSearchParams?: boolean;
  // 是否记录 body 数据
  recordBody?: boolean;
  // body data buffer 转换函数
  bodyTransformer?: BodyTransformer;
  // 请求过滤，返回 true 则不记录
  requestFilter?: RequestFilter;
  // 是否记录完整请求 URL，记录在 log 里
  recordFullUrl?: boolean;
  // 自定义 traceName
  traceName?: CustomTraceName;
}

export type RequestListener = (request: IncomingMessage, response: ServerResponse) => void;
// node v9.6.0+, v0.1.13+ 新增参数
export interface HttpCreateServerOptions {
  IncomingMessage?: IncomingMessage;
  ServerResponse?: ServerResponse;
}

export interface Tags {
  is_entry: boolean;
}

export interface HttpServerTags extends Tags {
  'http.method'?: string;
  'http.pathname'?: string;
  'http.client'?: boolean;
  'http.status_code'?: number;

}

export interface GlobalPatcherOptions extends PatcherOptions {
  recordConsole?: boolean;
  recordUnhandled?: boolean;
  recordFatal?: boolean;
}