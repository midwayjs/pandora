import {componentName, dependencies} from 'pandora-component-decorator';
import {IFastCompass, MetricName, MetricLevel} from 'metrics-common';


export const MetricsStat = {
  /** HTTP */
  HTTP_REQUEST: 'middleware.http.request',
  HTTP_REQUEST_PATH: 'middleware.http.request.path',
  HTTP_GROUP: 'http',
  HTTP_PATH: 'path',
  HTTP_ERROR_CODE: 400,
  HTTP_ILLEGAL_PATH: 'illegal_path'
};

@componentName('nodeMetrics')
@dependencies(['metrics'])
export default class ComponentMetricsHttpSeverMetrics {

  globalCompass: IFastCompass;
  constructor(ctx) {
    const globalName = new MetricName(MetricsStat.HTTP_REQUEST, {}, MetricLevel.NORMAL);
    this.globalCompass = ctx.metricsManager.getFastCompass(MetricsStat.HTTP_GROUP, globalName);
  }

  recordRequest(reportCtx) {
    let responseCode = reportCtx.resultCode;
    if (MetricsStat.HTTP_ERROR_CODE > parseInt(responseCode)) {
      this.globalCompass.record(reportCtx.rt, 'success');
    } else {
      this.globalCompass.record(reportCtx.rt, 'error');
    }
  }

}