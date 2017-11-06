import {ServiceConsumer} from './ServiceConsumer';
import {Introspection} from '../domain';
import {ServiceProxyBehaviourManager} from './ServiceProxyBehaviourManager';

export class DefaultServiceProxy {
  constructor(serviceConsumer: ServiceConsumer, introspection: Introspection) {
    const behaviour = ServiceProxyBehaviourManager.getInstance().getBehaviour(serviceConsumer.serviceDescription);
    const methods = introspection.methods;
    for (const method of methods) {
      this[method.name] = (...params) => {
        return behaviour.proxy.invoke(this, serviceConsumer, method.name, params);
      };
    }
  }
}