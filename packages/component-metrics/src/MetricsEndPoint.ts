import {IEndPoint} from 'pandora-component-actuator-server';
import {IndicatorManager} from 'pandora-component-indicator';

export class MetricsEndPoint implements IEndPoint {

  prefix = '/metrics';

  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }

  route(router) {

    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;

    router.get('/list', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('metrics', {
          action: 'list',
          appName: ctx.query['appName']
        });
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    router.get('/list/:group', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('metrics', {
          action: 'list',
          appName: ctx.query['appName'],
          group: ctx.params.group
        });
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });

    router.get('/:group', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('metrics', {
          action: 'group',
          appName: ctx.query['appName'],
          group: ctx.params.group
        });
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });

  }

}