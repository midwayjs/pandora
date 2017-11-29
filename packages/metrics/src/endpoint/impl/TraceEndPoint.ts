import {CacheDuplexEndPoint} from '../CacheDuplexEndPoint';
import {CommonCache} from '../../util/CommonCache';

export class TraceEndPoint extends CacheDuplexEndPoint {
  group: string = 'trace';

  processReporter(data, reply?) {
    if (data.appName && data.traceId) {
      // push after rate
      if(this.cacheByRate(data)) {
        let cache = this.cacheMap.get(data.appName);
        if (!cache) {
          cache = new CommonCache(this.config['cacheSize'] || CacheDuplexEndPoint.DEFAULT_CACHE_SIZE);
          this.cacheMap.set(data.appName, cache);
        }
        cache.push(data);
      }
    }
  }

  getRate() {
    return this.config['rate'];
  }

  cacheByRate(data) {
    return Math.round(Math.random() * 100) <= this.getRate();
  }
}