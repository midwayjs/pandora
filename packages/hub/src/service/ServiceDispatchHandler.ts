import {DispatchHandler, Introspection, ServiceMessage} from '../domain';
import {ServiceManager} from './ServiceManager';
import {SERVICE_ACTION_INVOKE} from '../const';
import {format} from 'util';
import {IntrospectionUtils} from './IntrospectionUtils';

export class ServiceDispatchHandler implements DispatchHandler {

  serviceManager: ServiceManager;
  constructor(serviceManager: ServiceManager) {
    this.serviceManager = serviceManager;
  }

  async dispatch(message: ServiceMessage) {
    if(message.action === SERVICE_ACTION_INVOKE) {
      return this.invoke(message);
    }
    if(message.action === 'SERVICE_ACTION_INTROSPECT') {
      return this.introspect(message);
    }
    throw new Error('unknown action ' + message.action);
  }

  async invoke (message: ServiceMessage) {
    const targetMethod = message.method;
    const serviceDescription = {
      name: message.remote.serviceName,
      tag: message.remote.tag
    };
    const obj = this.serviceManager.getService(serviceDescription);
    if(obj[targetMethod]) {
      return await obj[targetMethod].apply(obj, message.data);
    }
    throw new Error(format('can not found method called %s within service %j', targetMethod, serviceDescription));
  }

  introspect(message: ServiceMessage): Introspection {
    const serviceDescription = {
      name: message.remote.serviceName,
      tag: message.remote.tag
    };
    const obj = this.serviceManager.getService(serviceDescription);
    return IntrospectionUtils.introspect(obj);
  }

}
