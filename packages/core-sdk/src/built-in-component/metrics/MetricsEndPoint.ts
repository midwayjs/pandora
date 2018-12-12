import {IEndPoint} from '../actuator-server/domain';

export class MetricsEndPoint implements IEndPoint {

  prefix = '/metrics';

  route(router) {

    router.get('/list', async (ctx, next) => {
      try {
        ctx.ok('/list');
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    router.get('/list/:group', async (ctx, next) => {
      try {
        ctx.ok('/list/:group');
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    // router.get('/:group', async (ctx, next) => {
    //   try {
    //     if(metricsEndPoint.hasMetricsGroup(ctx.params.group)) {
    //       ctx.ok(await metricsEndPoint.getMetricsByGroup(ctx.params.group, ctx.query['appName']));
    //     } else {
    //       ctx.fail('The specified group is not found!');
    //     }
    //   } catch (err) {
    //     ctx.fail(err.message);
    //   }
    // });

    // this.router.get('/:name/level/:level', function (ctx, next) {
    //   // ...
    // });
    //
    // this.router.get('/:name/:metric', function (ctx, next) {
    //   // ...
    // });
  }

}