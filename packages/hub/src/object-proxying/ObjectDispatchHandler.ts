import {DispatchHandler, Introspection, ObjectMessage} from '../domain';
import {ProviderManager} from './ProviderManager';
import {OBJECT_ACTION_GET_PROPERTY, OBJECT_ACTION_INTROSPECT, OBJECT_ACTION_INVOKE} from '../const';
import {format} from 'util';
import {ObjectProxyBehaviourManager} from './ObjectProxyBehaviourManager';


export class ObjectDispatchHandler implements DispatchHandler {

  protected objectManager: ProviderManager;
  protected objectProxyBehaviourManager: ObjectProxyBehaviourManager;
  constructor(objectManager: ProviderManager) {
    this.objectManager = objectManager;
    this.objectProxyBehaviourManager = ObjectProxyBehaviourManager.getInstance();
  }

  async dispatch(message: ObjectMessage) {
    if(message.action === OBJECT_ACTION_INVOKE) {
      return this.invoke(message);
    }
    if(message.action === OBJECT_ACTION_GET_PROPERTY) {
      return this.getProperty(message);
    }
    if(message.action === OBJECT_ACTION_INTROSPECT) {
      return this.introspect(message);
    }
  }

  async invoke (message: ObjectMessage) {
    const targetMethod = message.propertyName;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    if(obj[targetMethod]) {
      return this.objectProxyBehaviourManager.getBehaviour(objectDescription).host.invoke(obj, targetMethod, message.data);
    }
    throw new Error(format('can not found method called %s within object %j', targetMethod, objectDescription));
  }

  private getProperty(message: ObjectMessage) {
    const propertyName = message.propertyName;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    if(obj[propertyName]) {
      return this.objectProxyBehaviourManager.getBehaviour(objectDescription).host.getProperty(obj, propertyName);
    }
  }

  introspect(message: ObjectMessage): Introspection {
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    return this.objectProxyBehaviourManager.getBehaviour(objectDescription).host.introspect(obj);
  }

  // TODO: access some properties
  // async access () {
  // }

}
