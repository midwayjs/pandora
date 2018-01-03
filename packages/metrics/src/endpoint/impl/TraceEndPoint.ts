import { CacheDuplexEndPoint } from '../CacheDuplexEndPoint';
import { CommonCache } from '../../util/CommonCache';
import { NORMAL_TRACE, SKIP_RATE } from '../../trace/Constants';

export class TraceEndPoint extends CacheDuplexEndPoint {
  group: string = 'trace';

  private _pushData(data) {
    let cache = this.cacheMap.get(data.appName);
    if (!cache) {
      cache = new CommonCache(this.config['cacheSize'] || CacheDuplexEndPoint.DEFAULT_CACHE_SIZE);
      this.cacheMap.set(data.appName, cache);
    }
    this.debug('push data by rate');
    cache.push(data);
  }

  processReporter(data, reply?) {
    if (data.appName && data.traceId) {
      // push after rate
      if(this.cacheByRate(data)) {
        this._pushData(data);
      } else if (data.status !== NORMAL_TRACE) {
        data[SKIP_RATE] = true;
        // 慢链路或者出错的链路优先保存
        this._pushData(data);
      } else {
        this.debug('drop trace: %j', data);
      }
    }
  }

  async invoke(args: {
    appName?: string,
    by?: 'size' | string,
    value?: number,
    order?: 'ASC' | 'DESC',
    offset?: number,
    limit?: number,
    traceId?: string
  } = {
    by: 'size',
    value: 0
  }) {
    const results = await super.invoke(args);

    if (args.traceId) {
      return results.filter((item) => {
        return item.traceId === args.traceId;
      });
    }

    return results;
  }

  getRate() {
    return this.config['rate'];
  }

  cacheByRate(data) {
    return Math.round(Math.random() * 100) <= this.getRate();
  }
}
