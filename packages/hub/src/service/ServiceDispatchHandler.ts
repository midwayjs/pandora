import {DispatchHandler, Introspection, ServiceMessage} from '../domain';
import {ProviderManager} from './ProviderManager';
import {SERVICE_ACTION_INTROSPECT, SERVICE_ACTION_INVOKE} from '../const';
import {format} from 'util';
import {ServiceProxyBehaviourManager} from './ServiceProxyBehaviourManager';


export class ServiceDispatchHandler implements DispatchHandler {

  protected serviceManager: ProviderManager;
  protected serviceProxyBehaviourManager: ServiceProxyBehaviourManager;
  constructor(serviceManager: ProviderManager) {
    this.serviceManager = serviceManager;
    this.serviceProxyBehaviourManager = ServiceProxyBehaviourManager.getInstance();
  }

  async dispatch(message: ServiceMessage) {
    if(message.action === SERVICE_ACTION_INVOKE) {
      return this.invoke(message);
    }
    if(message.action === SERVICE_ACTION_INTROSPECT) {
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
    const obj = this.serviceManager.getPublishedService(serviceDescription);
    if(obj[targetMethod]) {
      return this.serviceProxyBehaviourManager.getBehaviour(serviceDescription).host.invoke(obj, targetMethod, message.data);
    }
    throw new Error(format('can not found method called %s within service %j', targetMethod, serviceDescription));
  }

  introspect(message: ServiceMessage): Introspection {
    const serviceDescription = {
      name: message.remote.serviceName,
      tag: message.remote.tag
    };
    const obj = this.serviceManager.getPublishedService(serviceDescription);
    return this.serviceProxyBehaviourManager.getBehaviour(serviceDescription).host.introspect(obj);
  }

  // TODO: access some properties
  // async access () {
  // }

}
