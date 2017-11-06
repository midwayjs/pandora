import {ServiceConsumer} from './ServiceConsumer';
import {Introspection} from '../domain';
import {ServiceProxyBehaviourManager} from './ServiceProxyBehaviourManager';

const SERVICE_CONSUMER = Symbol();
const BEHAVIOUR = Symbol();

export class DefaultServiceProxy {
  constructor(serviceConsumer: ServiceConsumer, introspection: Introspection) {
    this[SERVICE_CONSUMER] = serviceConsumer;
    this[BEHAVIOUR] = ServiceProxyBehaviourManager.getInstance().getBehaviour(serviceConsumer.serviceDescription);
    const methods = introspection.methods;
    for (const method of methods) {
      this[method.name] = (...params) => {
        return this[BEHAVIOUR].proxy.invoke(this, serviceConsumer, method.name, params);
      };
    }

    const properties = introspection.properties;
    for (const property of properties) {
      Object.defineProperty(this, property.name, {
        get: function () {
          throw new Error(`Use 'await proxy.getProperty('${property.name}')' to replace 'proxy.${property.name}' when using IPC Object Proxy`);
        },
        set: function () {
          throw new Error(`Use 'await proxy.getProperty('${property.name}')' to replace 'proxy.${property.name}' when using IPC Object Proxy`);
        }
      });
    }
  }
  getProperty(name: string) {
    return this[BEHAVIOUR].proxy.getProperty(this, this[SERVICE_CONSUMER], name);
  }
}