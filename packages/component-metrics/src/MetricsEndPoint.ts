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

    router.get('/', async (ctx, next) => {
      try {
        const res = await indicatorManager.invokeAllProcessesRaw('metrics', {
          action: 'list'
        });
        ctx.body = res.map(it => it.data).join('\n');
      } catch (err) {
        ctx.fail(err.message);
      }
    });
  }

}
