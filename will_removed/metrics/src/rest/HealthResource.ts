import {EndPointService} from '../service/EndPointService';
import {ActuatorResource} from '../domain';
import {HealthEndPoint} from '../';
const debug = require('debug')('pandora:metrics:resource:health');

export class HealthResource implements ActuatorResource {

  prefix = '/health';

  endPointService: EndPointService;

  constructor(endPointService) {
    this.endPointService = endPointService;
  }

  route(router) {
    const healthEndPoint = <HealthEndPoint>this.endPointService.getEndPoint('health');

    router.get('/', async (ctx, next) => {
      let appName = ctx.query['appName'];
      debug(`in router and health by ${appName}`);
      let queryResults = await healthEndPoint.invoke({appName});

      if(appName) {
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
      } else {
        let healthRet = {};
        for(let appName in queryResults) {
          healthRet[appName] = {status: 'UP'};
          for( let queryResult of queryResults[appName]) {
            healthRet[appName][queryResult.key] = {status: queryResult.data};
            if(queryResult.data === 'DOWN') {
              healthRet[appName].status = 'DOWN';
            }
          }
        }
        try {
          ctx.ok(healthRet);
        } catch (err) {
          ctx.fail(err.message);
        }
      }
    });
  }
}
