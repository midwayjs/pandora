'use strict';
import {MESSENGER_ACTION_SERVICE} from '../const';
import assert = require('assert');
import {
  ServiceMessagePkg,
  ServiceMessageInvokeMethod,
  ServiceMessageSubscribeEvent,
  ServiceMessageUnsubscribeEvent, ServiceMessageDispatchEvent
} from '../domain';
import {SharedEventListenerStore} from './SharedEventListenerStore';
import {SimpleServiceCore} from './SimpleServiceCore';

/**
 * Class ProxyServiceCore
 */
export class ProxyServiceCore extends SimpleServiceCore {

  protected sharedEventListenerStore = new SharedEventListenerStore;
  protected stateKeepBuffer: Map<string, Map<any, (reason?: string) => any>> = new Map();
  protected remoteCoordinate: string;

  protected getImplClass() {
    return this.ImplClass.getProxy();
  }

  public async start() {

    await super.start();

    await this.ping();

    // Response event's callback
    this.messengerClient.on(MESSENGER_ACTION_SERVICE, (message: ServiceMessagePkg) => {
      if ('service-dispatch-event' === message.type && this.genServiceId() === message.serviceId) {
        const payload: ServiceMessageDispatchEvent = <ServiceMessageDispatchEvent> message.payload;
        this.dispatchEventLocal(payload.name, payload.listener, payload.event);
      }
    });

    // Handing service restart, use stateKeepBuffer to keep state
    this.messengerClient.on('connect', (event) => {
      (async (): Promise<any> => {
        for (let topic of this.stateKeepBuffer.values()) {
          for (let handler of topic.values()) {
            await handler('reconnect');
          }
        }
      })().catch((err) => {
        this.logger.error(err);
      });
    });
  }

  /**
   * Invoke Method
   * @param {string} name
   * @param {Array<any>} args
   * @return {Promise<void>}
   */
  public async invoke(name: string, args?: Array<any>) {
    args = args || [];
    const result = await this.sendRemote('service-invoke-method', <ServiceMessageInvokeMethod> {
      name: name,
      args: args
    });
    if (result.error) {
      throw new Error(`ServiceProxy invokeMethodRemote(${name}, ${args}) error: ${result.error}`);
    } else {
      return result.result;
    }
  }

  /**
   * Subscribe event
   * @param reg
   * @param listener
   * @return {Promise<any>}
   */
  public async subscribe(reg, listener) {
    return await this.keepState(reg, listener, async () => {
      const remoteListener = this.sharedEventListenerStore.registerByLocalListener(listener);
      return await this.sendRemote('service-subscribe-event', <ServiceMessageSubscribeEvent> {
        name: reg,
        listener: remoteListener
      });
    });
  }

  /**
   * Cancel subscribe event
   * @param reg
   * @param listener
   * @return {Promise<any>}
   */
  public async unsubscribe(reg, listener) {
    // Forget the state
    await this.forgetState(reg, listener);
    let remoteListener;
    if (listener) {
      remoteListener = this.sharedEventListenerStore.getRemoteListenerByLocalListener(listener);
    }
    const ret = await this.sendRemote('service-unsubscribe-event', <ServiceMessageUnsubscribeEvent> {
      name: reg,
      listener: remoteListener
    });
    if (ret.error) {
      throw new Error('unsubscribe error ' + ret.error);
    }
    this.sharedEventListenerStore.deleteByRemoteListener(remoteListener);
    return ret;
  }

  /**
   * Ping remote
   * @return {Promise<void>}
   */
  protected async ping() {
    await this.sendRemote('service-ping-remote');
  }

  /**
   * Send a meesage to remote
   * @param type
   * @param payload
   * @param timeout
   * @return {Promise<any>}
   */
  protected sendRemote(type, payload?, timeout?): Promise<any> {
    if (!timeout) timeout = 10000;
    return new Promise((resolve, reject) => {
      let emit = false;
      this.messengerClient.send(MESSENGER_ACTION_SERVICE, <ServiceMessagePkg> {
        type: type,
        serviceId: this.genServiceId(),
        payload: payload
      }, (err, result) => {
        if (emit) return;
        emit = true;
        if (err) {
          return reject(new Error('ServiceProxy sendRemote() Error, ' + err));
        } else {
          resolve(result);
        }
      });
      setTimeout(() => {
        if (emit) return;
        emit = true;
        reject(new Error(`ServiceProxy sendRemote() timeout, service: ${this.genServiceId()} remote: ${this.remoteCoordinate} type: ${type}`));
      }, timeout);
    });
  }

  /**
   * Dispatch remote event to local
   * @param reg
   * @param listener
   * @param event
   */
  protected dispatchEventLocal(reg, listener, event) {
    if (this.sharedEventListenerStore.hasByRemoteListener(listener)) {
      const localListener = this.sharedEventListenerStore.getLocalListenerByRemoteListener(listener);
      // Call local listener
      localListener(event);
    }
  }

  /**
   * Keep state with agent
   * @param topic
   * @param tag
   * @param handler
   * @return {Promise<any>}
   */
  protected async keepState(topic: any, tag, handler) {
    topic = ProxyServiceCore.flattenTopicName(topic);
    if (!this.stateKeepBuffer.has(topic)) {
      this.stateKeepBuffer.set(topic, new Map());
    }
    const topicMap = this.stateKeepBuffer.get(topic);
    assert(!topicMap.has(tag), 'duplicate keepState tag');
    topicMap.set(tag, handler);
    return await handler('init');
  }

  /**
   * Forget state
   * @param topic
   * @param tag
   * @return {Promise<void>}
   */
  protected async forgetState(topic: any, tag?) {
    topic = ProxyServiceCore.flattenTopicName(topic);
    assert(this.stateKeepBuffer.has(topic), 'abandon a unknown topic');
    if (tag) {
      const topicMap = this.stateKeepBuffer.get(topic);
      assert(topicMap.has(tag), 'abandon a unknown tag');
      topicMap.delete(tag);
    } else {
      this.stateKeepBuffer.delete(topic);
    }
  }

  /**
   * Convert topic to identify string
   * @param topicName
   * @return {string}
   */
  private static flattenTopicName(topicName): string {
    if (typeof topicName === 'string') {
      return topicName;
    } else {
      const ret = [];
      const keys = Object.keys(topicName).sort();
      for (let key of keys) {
        ret.push(`${JSON.stringify(key)}:${JSON.stringify(topicName[key])}`);
      }
      return '{' + ret.join(',') + '}';
    }
  }
}
