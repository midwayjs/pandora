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
        let daemonResults = await daemonEndPoint.invoke(ctx.query['appName']) || {};
        daemonResults['endPoints'] = this.endPointService.getEndPointNames();
        ctx.ok(daemonResults);
      } catch (err) {
        ctx.fail(err.message);
      }
      await next();
    });
  }
}
