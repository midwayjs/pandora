import {componentName, dependencies} from 'pandora-component-decorator';
import {IFastCompass, MetricName, MetricLevel} from 'metrics-common';
import {basename} from 'path';


export const MetricsStat = {
  /** HTTP */
  HTTP_REQUEST: 'middleware.http.request',
  HTTP_REQUEST_PATH: 'middleware.http.request.path',
  HTTP_GROUP: 'http',
  HTTP_PATH: 'path',
  HTTP_ERROR_CODE: 400,
  HTTP_ILLEGAL_PATH: 'illegal_path'
};

@componentName('httpServerMetrics')
@dependencies(['metrics'])
export default class ComponentHttpServerMetrics {

  globalCompass: IFastCompass;
  constructor(ctx) {
    if (ctx && ctx.mode === 'worker' && !basename(process.argv[1]).match(/agent/)) {
      const globalName = new MetricName(MetricsStat.HTTP_REQUEST, {}, MetricLevel.NORMAL);
      this.globalCompass = ctx.metricsManager.getFastCompass(MetricsStat.HTTP_GROUP, globalName);
      ctx.httpServerMetrics = this;
    }
  }

  recordRequest(reportCtx) {
    let responseCode = reportCtx.resultCode;
    if (!this.globalCompass) return;
    if (MetricsStat.HTTP_ERROR_CODE > parseInt(responseCode)) {
      this.globalCompass.record(reportCtx.rt, 'success');
    } else {
      this.globalCompass.record(reportCtx.rt, 'error');
    }
  }

}