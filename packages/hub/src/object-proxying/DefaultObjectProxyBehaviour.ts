import {IntrospectionUtils} from './IntrospectionUtils';
import {ObjectConsumer} from './ObjectConsumer';
import {ObjectProxyBehaviour} from '../domain';

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
    }
  },
  proxy: {
    invoke (proxy, consumer: ObjectConsumer, method, params) {
      return consumer.invoke(method, params);
    },
    getProperty(proxy, consumer: ObjectConsumer, name) {
      return consumer.getProperty(name);
    },
  }
};
