import {ActuatorResource} from '../domain';
import {EndPointService} from '../service/EndPointService';

export class ErrorResource implements ActuatorResource {

  prefix = '/error';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {
    const errorEndPoint = this.endPointService.getEndPoint('error');
    router.get('/', async (ctx, next) => {
      try {
        const { by, value, order, offset, limit, appName } = ctx.query;
        const items = await errorEndPoint.invoke({
          appName,
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
  }
}
