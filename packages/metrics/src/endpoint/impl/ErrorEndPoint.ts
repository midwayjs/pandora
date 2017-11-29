/**
 * 错误日志 EndPoint
 *
 */

import {CacheDuplexEndPoint} from '../CacheDuplexEndPoint';

export class ErrorEndPoint extends CacheDuplexEndPoint {
  group: string = 'error';
}
