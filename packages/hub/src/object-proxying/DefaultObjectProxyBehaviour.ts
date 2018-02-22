import {IntrospectionUtils} from './IntrospectionUtils';
import {ObjectConsumer} from './ObjectConsumer';
import {CallbackLocation, ObjectDescription, ObjectProxyBehaviour} from '../domain';
import {HubClient} from '../hub/HubClient';
import {OBJECT_ACTION_INVOKE} from '../const';

const hostWeakExtMap = new WeakMap();

export const DefaultObjectProxyBehaviour: ObjectProxyBehaviour = {
  host: {
    invoke (host, method, params) {
      return host[method].apply(host, params);
    },
    getProperty(host, name) {
      return host[name];
    },
    introspect (host) {
      return IntrospectionUtils.introspect(host);
    },
    subscribe(hub: HubClient, objectDescription: ObjectDescription, host, registor: string) {
      if(!hostWeakExtMap.has(host)) {
        hostWeakExtMap.set(host, new Map());
      }
      const hostExt: Map = hostWeakExtMap.get(host);
      const countKey = registor + '@count';
      if(!hostExt.has(countKey)) {
        hostExt.set(countKey, 0);
      }
      const cnt = hostExt.get(countKey) + 1;
      hostExt.set(countKey, cnt);
      if(cnt === 1) {
        const cb = async (...params) => {
          await hub.multipleInvoke({
            objectTag: objectDescription.tag,
            objectName: objectDescription.name,
            subscriber: true
          }, OBJECT_ACTION_INVOKE, {
            data: params
          });
        };
        hostExt.set(registor, cb);
        host.subscribe(registor, cb);
      }
    },
    unsubscribe(hub: HubClient, objectDescription: ObjectDescription, host, registor: string) {
      const map: Map = hostWeakExtMap.get(host);
      const countKey = registor + '@count';
      const cnt = map.get(countKey) - 1;
      map.set(countKey, cnt);
      if(cnt === 0) {
        host.unsubscribe(registor, map.get(registor));
      }
    },
  },
  proxy: {
    invoke (proxy, consumer: ObjectConsumer, method, params) {
      return consumer.invoke(method, params);
    },
    subscribe(proxy, consumer, registor: string, callbackPosition: CallbackLocation) {

    },
    unsubscribe(proxy, consumer, registor: string, callbackPosition?: CallbackLocation) {

    },
    getProperty(proxy, consumer: ObjectConsumer, name) {
      return consumer.getProperty(name);
    },
  }
};
