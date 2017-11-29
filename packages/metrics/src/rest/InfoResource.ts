import {ActuatorResource} from '../domain';
import {EndPointService} from '../service/EndPointService';

export class InfoResource implements ActuatorResource {

  prefix = '/info';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const infoEndPoint = this.endPointService.getEndPoint('info');

    router.get('/', async (ctx, next) => {
      /**
       * [
       *  {
       *    "appName": "DEFAULT_APP",
       *    "appDir": "/Users/harry/project/pandora/pandora/packages/metrics/test"
       *  }
       * ]
       */
      try {
        const appInfos = await infoEndPoint.invoke(ctx.query['appName']);
        ctx.ok(appInfos.map(info => {
          return info.data;
        }));
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });
  }
}
