import {ObjectConsumer} from './ObjectConsumer';
import {Introspection} from '../domain';
import {ObjectProxyBehaviourManager} from './ObjectProxyBehaviourManager';

const OBJECT_CONSUMER = Symbol();
const BEHAVIOUR = Symbol();

export class DefaultObjectProxy {
  constructor(objectConsumer: ObjectConsumer, introspection: Introspection) {
    this[OBJECT_CONSUMER] = objectConsumer;
    this[BEHAVIOUR] = ObjectProxyBehaviourManager.getInstance().getBehaviour(objectConsumer.objectDescription);
    const methods = introspection.methods;
    for (const method of methods) {
      this[method.name] = (...params) => {
        return this[BEHAVIOUR].proxy.invoke(this, objectConsumer, method.name, params);
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
    return this[BEHAVIOUR].proxy.getProperty(this, this[OBJECT_CONSUMER], name);
  }
}