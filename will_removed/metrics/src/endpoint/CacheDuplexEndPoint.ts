import {DuplexEndPoint} from './DuplexEndPoint';
import {CommonCache} from '../util/CommonCache';

export class CacheDuplexEndPoint extends DuplexEndPoint {

  cacheMap: Map<string, CommonCache> = new Map();
  static DEFAULT_CACHE_SIZE = 100;

  processReporter(data, reply?) {
    if(data.appName) {
      let cache = this.cacheMap.get(data.appName);
      if(!cache) {
        cache = new CommonCache(this.config['cacheSize'] || CacheDuplexEndPoint.DEFAULT_CACHE_SIZE);
        this.cacheMap.set(data.appName, cache);
      }
      cache.push(data);
    }
  }

  invoke(args: {
    appName?: string,
    by?: 'size' | string,
    value?: number,
    order?: 'ASC' | 'DESC',
    offset?: number,
    limit?: number
  } = {
    by: 'size',
    value: 0
  }) {
    let appName = args.appName;
    let cache = this.cacheMap.get(appName);
    // 如果只有一个应用，直接返回该应用信息
    if(!appName && this.cacheMap.size === 1) {
      cache = Array.from(this.cacheMap.values())[0];
    }

    if(cache) {
      return Promise.resolve(cache.query(args));
    } else {
      return Promise.resolve([]);
    }
  }
}
