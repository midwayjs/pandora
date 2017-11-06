import {ServiceDescription} from '../domain';

export class ServiceUtils {
  static serviceDescriptionToId (serviceDescription: ServiceDescription) {
    const id = serviceDescription.name + serviceDescription.tag ? ( ':' + serviceDescription.tag ) : '';
    return id;
  }
}