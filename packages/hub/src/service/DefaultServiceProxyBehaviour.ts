import {IntrospectionUtils} from './IntrospectionUtils';
import {ServiceConsumer} from './ServiceConsumer';
import {ServiceProxyBehaviour} from '../domain';

export const DefaultServiceProxyBehaviour: ServiceProxyBehaviour = {
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
    invoke (proxy, consumer: ServiceConsumer, method, params) {
      return consumer.invoke(method, params);
    },
    getProperty(proxy, consumer: ServiceConsumer, name) {
      return consumer.getProperty(name);
    },
  }
};
