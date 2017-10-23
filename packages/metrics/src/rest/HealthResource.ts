import {HealthEndPoint} from '../endpoint/impl/HealthEndPoint';
import {EndPointService} from '../service/EndPointService';
import {ActuatorResource} from '../domain';

export class HealthResource implements ActuatorResource {

  prefix = '/health';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {
    const healthEndPoint = <HealthEndPoint>this.endPointService.getEndPoint('health');

    router.get('/', async (ctx, next) => {
      let queryResults = await healthEndPoint.invoke();
      let healthRet = {status: 'UP'};

      for(let queryResult of queryResults) {
        healthRet[queryResult.key] = {status: queryResult.data};
        if(queryResult.data === 'DOWN') {
          healthRet.status = 'DOWN';
        }
      }
      try {
        ctx.ok(healthRet);
      } catch (err) {
        ctx.fail(err.message);
      }
    });
  }
}
