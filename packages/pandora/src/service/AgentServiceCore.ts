'use strict';
import {MESSENGER_ACTION_SERVICE} from '../const';
import {
  ServiceMessagePkg,
  ServiceMessageInvokeMethod,
  ServiceMessageSubscribeEvent,
  ServiceMessageUnsubscribeEvent, ServiceMessageDispatchEvent
} from '../domain';
import {SharedEventListenerStore} from './SharedEventListenerStore';
import {SimpleServiceCore} from './SimpleServiceCore';

const debug = require('debug')('pandora:AgentServiceCore');

/**
 * Class AgentServiceCore
 */
export class AgentServiceCore extends SimpleServiceCore {

  protected sharedEventListenerStore = new SharedEventListenerStore;

  async start() {

    await super.start();

    // Listen remote message
    if (this.messengerServer) {
      this.messengerServer.on(MESSENGER_ACTION_SERVICE, (message: ServiceMessagePkg, reply, client) => {

        // Ignore if that not for this service it own
        if (this.genServiceId() !== message.serviceId) return;

        // Response ping
        if ('service-ping-remote' === message.type) {
          reply('done');
          return;
        }

        // Response method invocation
        if ('service-invoke-method' === message.type) {
          const payload: ServiceMessageInvokeMethod = <ServiceMessageInvokeMethod> message.payload;
          this.invoke(payload.name, payload.args).then((result) => {
            reply({error: null, result: result});
          }).catch((err) => {
            reply({error: err});
          });
          return;
        }

        // Response event subscribe
        if ('service-subscribe-event' === message.type) {
          const payload: ServiceMessageSubscribeEvent = <ServiceMessageSubscribeEvent> message.payload;
          const remoteListener = payload.listener;
          const name = payload.name;
          const localListener = (event) => {
            debug('service-dispatch-event %s', name);
            client.send(MESSENGER_ACTION_SERVICE, <ServiceMessagePkg> {
              type: 'service-dispatch-event',
              serviceId: this.genServiceId(),
              payload: <ServiceMessageDispatchEvent> {
                name: name,
                listener: remoteListener,
                event: event
              }
            });
          };
          this.sharedEventListenerStore.registerByRemoteListener(remoteListener, localListener);
          this.subscribe(name, localListener).then((result) => {
            reply({error: null, result: result});
          }).catch((err) => {
            this.logger.error(err);
            reply({error: err});
          });

          client.on('close', () => {
            this.sharedEventListenerStore.deleteByRemoteListener(remoteListener);
            this.unsubscribe(name, localListener).catch((err) => {
              this.logger.error(err);
            });
          });

          return;
        }

        // Response event cancel subscribe
        if ('service-unsubscribe-event' === message.type) {
          const payload: ServiceMessageUnsubscribeEvent = <ServiceMessageUnsubscribeEvent> message.payload;
          const remoteListener = payload.listener;
          const name = payload.name;
          const localListener = remoteListener ?
            this.sharedEventListenerStore.getLocalListenerByRemoteListener(remoteListener)
            : remoteListener;
          this.unsubscribe(name, localListener).then((result) => {
            this.sharedEventListenerStore.deleteByRemoteListener(remoteListener);
            reply({error: null, result: result});
          }).catch((err) => {
            this.logger.error(err);
            reply({error: err});
          });
          return;
        }

      });
    }

  }
}
