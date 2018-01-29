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
        const items = await traceEndPoint.invoke( {
          appName: ctx.query['appName'],
          by,
          value: Number(value),
          order
        });
        const count = items.length;
        let ret = items;
        if(offset != null && limit != null) {
          const nOffset = Number(offset);
          const nLimit = Number(limit);
          ret = ret.slice(nOffset, nOffset + nLimit);
        }
        ctx.ok({
          count, offset, limit, items: ret
        });
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });

    router.get('/:traceId', async (ctx, next) => {
      try {
        const traceId = ctx.params.traceId;
        const res = await traceEndPoint.invoke( {
          appName: ctx.query['appName'],
          traceId: traceId
        });
        const ret = res[0];
        if(!ret) {
          throw new Error('Can\'t got a trace, it maybe already has been clean. Trace Id: ' + traceId);
        }
        ctx.ok(ret);
      } catch (err) {
        ctx.fail(err.message);
      }

      await next();
    });
  }
}
