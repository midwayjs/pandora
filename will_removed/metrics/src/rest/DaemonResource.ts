import {EndPointService} from '../service/EndPointService';
import {ActuatorResource} from '../domain';
import {DaemonEndPoint} from '../endpoint/impl/DaemonEndPoint';

export class DaemonResource implements ActuatorResource {

  prefix = '/daemon';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {

    const daemonEndPoint = <DaemonEndPoint>this.endPointService.getEndPoint('daemon');
    router.get('/', async (ctx, next) => {
      try {
        ctx.ok(await daemonEndPoint.invoke({
          appName: ctx.query['appName']
        }));
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });
  }
}
