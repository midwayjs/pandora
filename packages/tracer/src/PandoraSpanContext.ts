import { SpanContext } from 'opentracing';
import { Baggage } from './domain';

export class PandoraSpanContext extends SpanContext {
  private _traceId: string;
  private _baggage: Baggage;
  private _parentId: string;
  private _spanId: string;
  private _traceName: string;

  constructor(
    traceId?: string,
    rpcId?: string,
    baggage?: Baggage
  ) {
    super();

    this._traceId = traceId;
    this._baggage = baggage || new Map();
    this._spanId = parsed.spanId;
    this._parentId = parsed.parentId;
  }

  get logger() {
    return getLogger();
  }

  get traceId(): string {
    if (!this._traceId) {
        this._traceId = generate();
    }

    return this._traceId;
  }

  set traceId(traceId: string) {
    this._traceId = traceId;
  }

  get traceName(): string {
    return this._traceName;
  }

  set traceName(traceName: string) {
    this._traceName = traceName;
  }

  get rpcId(): string {
    return this._rpcId;
  }

  get childRpcIdx(): number {
    return this._childRpcIdx;
  }

  /**
   * 表示网络调用的编码，格式为 `_rpcId._childRpcIdx`
   * _rpcId 表示当前请求编号，默认为 0
   * _childRpcIdx 表示该请求发出的请求编号，初始值为 0，自增
   * 如：请求进入入口系统后，这个请求发出的第一个请求的编号为0.1，第二个请求为 0.2，依次类推。
   * 如果是网关系统，那么会有上游系统调用，可能是 0.10.1，0.10.2。
   */
  get nextChildRpcId(): string {
    return this._rpcId + RPC_ID_SEPARATOR + (++ this._childRpcIdx);
  }

  get spanId(): string {
    return this._spanId;
  }

  get parentId(): string {
    return this._parentId;
  }

  get baggage(): Baggage {
    return this._baggage;
  }

  set baggage(baggage: Baggage) {
    this._baggage = baggage;
  }

  get userData(): Baggage {
    return this._baggage;
  }

  set userData(baggage: Baggage) {
    this._baggage = baggage;
  }

  setBaggageItem(key: string, value: any) {
    if (!key || key.length > MAX_USER_DATA_ENTRY_SIZE) {
      this.logger.warn('UserData is not accepted since key is blank or too long: %s', key);
      return;
    }
    if (value && value.length > MAX_USER_DATA_ENTRY_SIZE) {
      this.logger.warn('UserData is not accepted since value is too long: %s', value);
      return;
    }

    this._baggage.set(key, value);
  }

  getBaggageItem(key: string): any {
    return this._baggage.get(key);
  }

  removeBaggageItem(key: string) {
    this._baggage.delete(key);
  }

  putUserData(key: string, value: any) {
    this.setBaggageItem(key, value);
  }

  getUserData(key: string) {
    return this.getBaggageItem(key);
  }

  removeUserData(key: string) {
    this.removeBaggageItem(key);
  }

  exportUserData() {
    if (this._baggage.size === 0) {
      return null;
    }
    let userData = '';
    for (const key of this._baggage.keys()) {
      const value = this._baggage.get(key);
      if (key && value) {
        userData += `${key}${KV_SEPARATOR}${value}${ENTRY_SEPARATOR}`;
      }
      if (userData.length >= MAX_USER_DATA_TOTAL_SIZE) {
        this.logger.warn('Eagleeye userData is too long, size=%d', userData.length);
        break;
      }
    }
    return userData;
  }
}