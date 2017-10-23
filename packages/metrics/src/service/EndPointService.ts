import {ActuatorService, IEndPoint} from '../domain';

export class EndPointService implements ActuatorService {

  private endPointIns: Array<IEndPoint>;

  private endPointInsMap: Map<string, IEndPoint> = new Map();

  private logger = console;

  start() {

    for (let endPoint of this.endPointIns) {
      endPoint.initialize();
      this.endPointInsMap.set(endPoint.group, endPoint);
    }
  }

  register(endPoint: IEndPoint) {
    endPoint.setLogger(this.logger);
    endPoint.initialize();
    this.endPointInsMap.set(endPoint.group, endPoint);
  }

  getEndPoint(group): IEndPoint {
    return this.endPointInsMap.get(group);
  }

  getEndPointNames(): Array<string> {
    return Array.from(this.endPointInsMap.keys());
  }

  getEndPoints(): Map<string, IEndPoint> {
    return this.endPointInsMap;
  }

  setEndPointIns(endPointIns) {
    this.endPointIns = endPointIns;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  stop() {
    for (let endPoint of this.endPointIns) {
      endPoint.destory();
    }
  }

}
