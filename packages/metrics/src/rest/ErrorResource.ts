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
        ctx.ok(await errorEndPoint.invoke(ctx.query['appName']));
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });
  }
}
