import {MetricsEndPoint} from '../endpoint/impl/MetricsEndPoint';
import {EndPointService} from '../service/EndPointService';
import {ActuatorResource} from '../domain';

export class MetricsResource implements ActuatorResource {

  prefix = '/metrics';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const metricsEndPoint = <MetricsEndPoint>this.endPointService.getEndPoint('metrics');
    router.get('/list', async (ctx, next) => {
      try {
        ctx.ok(metricsEndPoint.listMetrics());
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    router.get('/:group', async (ctx, next) => {
      try {
        if(metricsEndPoint.hasMetricsGroup(ctx.params.group)) {
          ctx.ok(metricsEndPoint.getMetricsByGroup(ctx.params.group));
        } else {
          ctx.fail('The specified group is not found!');
        }
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    // this.router.get('/:name/level/:level', function (ctx, next) {
    //   // ...
    // });
    //
    // this.router.get('/:name/:metric', function (ctx, next) {
    //   // ...
    // });
  }
}
