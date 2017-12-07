import {SERVICE_RESERVE_NAME} from '../const';

export class ServiceUtils {
  static checkName (name) {
    if(SERVICE_RESERVE_NAME.indexOf(name) > -1) {
      throw new Error(`The service name ${name} has been reserved`);
    }
  }
}