import {
  DispatchHandler,
  Introspection,
  ObjectMessage,
  SubscribeMessage,
} from '../types';
import { ProviderManager } from './ProviderManager';
import {
  OBJECT_ACTION_GET_PROPERTY,
  OBJECT_ACTION_INTROSPECT,
  OBJECT_ACTION_INVOKE,
  OBJECT_ACTION_SUBSCRIBE,
  OBJECT_ACTION_UNSUBSCRIBE,
} from '../const';
import { format } from 'util';
import { ObjectProxyBehaviourManager } from './ObjectProxyBehaviourManager';

/**
 * ObjectDispatchHandler
 * Handle actions of Object Proxying
 */
export class ObjectDispatchHandler implements DispatchHandler {
  protected objectManager: ProviderManager;
  protected objectProxyBehaviourManager: ObjectProxyBehaviourManager;
  constructor(objectManager: ProviderManager) {
    this.objectManager = objectManager;
    this.objectProxyBehaviourManager = ObjectProxyBehaviourManager.getInstance();
  }

  /**
   * Handle actions of Object Proxying
   * @param {ObjectMessage} message
   * @return {Promise<any>}
   */
  async dispatch(message: ObjectMessage & SubscribeMessage) {
    if (message.action === OBJECT_ACTION_INVOKE) {
      return this.invoke(message);
    }
    if (message.action === OBJECT_ACTION_GET_PROPERTY) {
      return this.getProperty(message);
    }
    if (message.action === OBJECT_ACTION_INTROSPECT) {
      return this.introspect(message);
    }
    if (message.action === OBJECT_ACTION_SUBSCRIBE) {
      return this.subscribe(message);
    }
    if (message.action === OBJECT_ACTION_UNSUBSCRIBE) {
      return this.unsubscribe(message);
    }
  }

  /**
   * Handle action OBJECT_ACTION_INVOKE
   * @param {ObjectMessage} message
   * @return {Promise<any>}
   */
  async invoke(message: ObjectMessage) {
    const targetMethod = message.propertyName;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag,
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    if (obj[targetMethod]) {
      return this.objectProxyBehaviourManager
        .getBehaviour(objectDescription)
        .host.invoke(obj, targetMethod, message.data);
    }
    throw new Error(
      format(
        'Cannot found method called %s within object %j',
        targetMethod,
        objectDescription
      )
    );
  }

  /**
   * Handle action OBJECT_ACTION_GET_PROPERTY
   * @param {ObjectMessage} message
   * @return {Promise<any>}
   */
  private getProperty(message: ObjectMessage) {
    const propertyName = message.propertyName;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag,
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    if (obj[propertyName]) {
      return this.objectProxyBehaviourManager
        .getBehaviour(objectDescription)
        .host.getProperty(obj, propertyName);
    }
  }

  /**
   * Handle action OBJECT_ACTION_SUBSCRIBE
   * @param {SubscribeMessage} message
   * @return {Promise<any>}
   */
  async subscribe(message: SubscribeMessage) {
    const register = message.register;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag,
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    const behaviour = this.objectProxyBehaviourManager.getBehaviour(
      objectDescription
    );
    await behaviour.host.subscribe(
      this.objectManager.hubClient,
      objectDescription,
      obj,
      register
    );
  }

  /**
   * Handle action OBJECT_ACTION_UNSUBSCRIBE
   * @param {SubscribeMessage} message
   * @return {Promise<any>}
   */
  async unsubscribe(message: SubscribeMessage) {
    const register = message.register;
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag,
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    const behaviour = this.objectProxyBehaviourManager.getBehaviour(
      objectDescription
    );
    await behaviour.host.unsubscribe(
      this.objectManager.hubClient,
      objectDescription,
      obj,
      register
    );
  }

  /**
   * Handle action OBJECT_ACTION_INTROSPECT
   * @param {ObjectMessage} message
   * @return {Introspection}
   */
  introspect(message: ObjectMessage): Introspection {
    const objectDescription = {
      name: message.remote.objectName,
      tag: message.remote.objectTag,
    };
    const obj = this.objectManager.getPublishedObject(objectDescription);
    return this.objectProxyBehaviourManager
      .getBehaviour(objectDescription)
      .host.introspect(obj);
  }
}
