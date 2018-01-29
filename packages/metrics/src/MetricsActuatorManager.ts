import {EndPointService} from './service/EndPointService';
import {ActuatorRestService} from './service/ActuatorRestService';

export class MetricsActuatorManager {

  endPointService;

  actuatorRestService;

  actuatorConfig = {
    endPoint: {}
  };

  logger;

  constructor(options: {
    logger,
    config: {
      http,
      endPoint,
    }
  }) {
    this.logger = options.logger;
    this.actuatorConfig = options.config;
    // 初始化各个 endpoints
    this.initEndPoints();
    // 初始化 http 服务
    this.initRestService();
  }

  initEndPoints() {
    this.endPointService = new EndPointService();
    this.endPointService.setLogger(this.logger);

    let instances = [];

    const endPoints = this.actuatorConfig['endPoint'];

    for(let endPointName in endPoints) {
      if(endPoints[endPointName].enabled !== false) {
        let ins = new endPoints[endPointName].target();
        if(endPoints[endPointName].initConfig) {
          ins.setConfig(endPoints[endPointName].initConfig);
        }
        instances.push(ins);
      }
    }

    this.endPointService.setEndPointIns(instances);
    this.endPointService.start();
  }

  initRestService() {
    this.actuatorRestService = new ActuatorRestService(this.endPointService);
    this.actuatorRestService.start(this.actuatorConfig);
  }

  destory() {
    this.actuatorRestService.stop();
    this.endPointService.stop();
  }
}
