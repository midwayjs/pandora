import {IntrospectionUtils} from './IntrospectionUtils';
import {ObjectConsumer} from './ObjectConsumer';
import {ObjectDescription, ObjectProxyBehaviour} from '../types';
import {HubClient} from '../hub/HubClient';
import {OBJECT_ACTION_INVOKE} from '../const';

const hostWeakExtMap: WeakMap<any, any> = new WeakMap();

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
    async subscribe(hub: HubClient, objectDescription: ObjectDescription, host, register: string) {

      if(!hostWeakExtMap.has(host)) {
        hostWeakExtMap.set(host, new Map());
      }
      const hostExt: Map<string, any> = hostWeakExtMap.get(host);

      const {countKey, cbKey} = getSubscribeKeys(register);

      if(!hostExt.has(countKey)) {
        hostExt.set(countKey, 0);
      }
      const cnt = hostExt.get(countKey) + 1;
      hostExt.set(countKey, cnt);

      if(cnt === 1) {
        const cb = async (...params) => {
          await hub.multipleInvoke({
            objectTag: objectDescription.tag,
            objectName: objectDescription.name + '@subscriber',
          }, OBJECT_ACTION_INVOKE, {
            propertyName: 'callback',
            data: [register, params]
          });
        };
        hostExt.set(cbKey, cb);
        await host.subscribe(register, cb);
      }

      return true;

    },
    async unsubscribe(hub: HubClient, objectDescription: ObjectDescription, host, register: string) {

      const map: Map<string, any> = hostWeakExtMap.get(host);

      const {countKey, cbKey} = getSubscribeKeys(register);

      const cnt = map.get(countKey) - 1;
      map.set(countKey, cnt);

      if(cnt === 0) {
        await host.unsubscribe(register, map.get(cbKey));
        map.delete(countKey);
        map.delete(cbKey);
      }

      return true;

    },
  },
  proxy: {
    invoke (proxy, consumer: ObjectConsumer, method, params) {
      return consumer.invoke(method, params);
    },
    subscribe(proxy, consumer: ObjectConsumer, register: string, fn) {
      return consumer.subscribe(register, fn);
    },
    unsubscribe(proxy, consumer: ObjectConsumer, register: string, fn?) {
      return consumer.unsubscribe(register, fn);
    },
    getProperty(proxy, consumer: ObjectConsumer, name) {
      return consumer.getProperty(name);
    },
  }
};

function getSubscribeKeys (register) {
  const countKey = register + '@count';
  const cbKey = register + '@cb';
  return { countKey, cbKey };
}
