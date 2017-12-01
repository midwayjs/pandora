import {EndPointService} from '../service/EndPointService';
import {ActuatorResource} from '../domain';
import {TraceEndPoint} from '../endpoint/impl/TraceEndPoint';

export class TraceResource implements ActuatorResource {

  prefix = '/trace';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const traceEndPoint = <TraceEndPoint>this.endPointService.getEndPoint('trace');
    router.get('/', async (ctx, next) => {
      try {
        const { by, value, order, offset, limit } = ctx.query;
        ctx.ok(await traceEndPoint.invoke(ctx.query['appName'], {
          by,
          value: Number(value),
          order,
          offset: Number(offset) || undefined,
          limit: Number(limit) || undefined
        }));
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });

    router.get('/:traceId', async (ctx, next) => {
      try {
        ctx.ok(await traceEndPoint.invoke(ctx.query['appName'], {
          traceId: ctx.params.traceId
        }));
      } catch (err) {
        ctx.fail(err.message);
      }

      await next();
    });
  }
}
