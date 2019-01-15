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
          action: 'list'
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
          group: ctx.params.group
        });
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });

  }

}