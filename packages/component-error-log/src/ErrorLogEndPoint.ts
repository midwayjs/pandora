import {IEndPoint} from 'pandora-component-actuator-server';
import {IndicatorManager} from 'pandora-component-indicator';

export class ErrorLogEndPoint implements IEndPoint {

  prefix = '/error';

  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }

  route(router) {

    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;

    router.get('/', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('errorLog', {
          action: 'list',
          limit: ctx.query.limit ? parseInt(ctx.query.limit) : null
        });
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });

  }

}