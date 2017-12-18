import {ActuatorResource} from '../domain';
import {EndPointService} from '../service/EndPointService';

export class ProcessResource implements ActuatorResource {

  prefix = '/process';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const processEndPoint = this.endPointService.getEndPoint('process');

    router.get('/', async (ctx, next) => {
      if(!ctx.query['appName']) {
        ctx.fail('please query data by appName');
      } else {
        try {
          const processInfos = await processEndPoint.invoke(ctx.query);
          ctx.ok(processInfos.map(info => {
            return info.data;
          }));
        } catch (err) {
          ctx.fail(err.message);
        }
      }
      await next();
    });
  }
}
