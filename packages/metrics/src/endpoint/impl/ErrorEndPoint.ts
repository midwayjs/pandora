/**
 * 错误日志 EndPoint
 *
 */

import {DuplexEndPoint} from '../DuplexEndPoint';
import {LogCache} from '../../util/LogCache';

const defaultMaxErrorCount = 100;

export class ErrorEndPoint extends DuplexEndPoint {

  group: string = 'error';

  cacheMap: Map<string, LogCache> = new Map();

  processReporter(data) {
    if(data.appName) {
      let cache = this.cacheMap.get(data.appName);
      if(!cache) {
        cache = new LogCache(this.config['maxErrorCount'] || defaultMaxErrorCount);
        this.cacheMap.set(data.appName, cache);
      }
      cache.push(data);
    }
  }

  invoke(appName: string, args: {
    by: 'size' | 'time',
    value: number,
    order?: 'ASC' | 'DESC'
  } = {
    by: 'size',
    value: 0,
  }) {
    let cache = this.cacheMap.get(appName);
    // 如果只有一个应用，直接返回该应用信息
    if(!appName && this.cacheMap.size == 1) {
      cache = Array.from(this.cacheMap.values())[0];
    }

    if(cache) {
      return Promise.resolve(cache.query(args));
    } else {
      return Promise.resolve([]);
    }
  }
}
