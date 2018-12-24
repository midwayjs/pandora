import { IEndPoint } from '../actuator-server/domain';
import { IndicatorManager } from '../indicator/IndicatorManager';

export class TraceEndPoint implements IEndPoint {

  prefix = '/trace';

  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }

  route(router) {

    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;

    router.get('/list', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('trace', ctx.query);
        ctx.ok(res);
      } catch (err) {
        ctx.fail(err.message);
      }
    });
  }

}