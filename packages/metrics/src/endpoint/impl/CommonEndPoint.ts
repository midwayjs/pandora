import {CacheDuplexEndPoint} from '../CacheDuplexEndPoint';
import {EndPoint} from '../EndPoint';

export class ErrorEndPoint extends CacheDuplexEndPoint {
  group: string = 'error';
}

export class HealthEndPoint extends EndPoint {
  group: string = 'health';
}

export class ProcessEndPoint extends EndPoint {
  group: string = 'process';
}
