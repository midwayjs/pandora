import {IEndPoint} from 'pandora-component-actuator-server';
import {IndicatorManager} from 'pandora-component-indicator';

export class ProcessEndPoint implements IEndPoint {

  prefix = '/process';

  ctx: any;
  constructor(ctx) {
    this.ctx = ctx;
  }

  route(router) {
    const indicatorManager: IndicatorManager = this.ctx.indicatorManager;
    router.get('/', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('process', {
          appName: ctx.query['appName']
        });
        const res2nd = res.map((processData) => processData.data);
        ctx.ok(res2nd);
      } catch (err) {
        ctx.fail(err.message);
      }
    });
  }

}
