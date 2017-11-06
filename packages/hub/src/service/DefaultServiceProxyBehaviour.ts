import {IntrospectionUtils} from './IntrospectionUtils';
import {ServiceConsumer} from './ServiceConsumer';
import {ServiceProxyBehaviour} from '../domain';

export const DefaultServiceProxyBehaviour: ServiceProxyBehaviour = {
  host: {
    invoke (host, method, params) {
      return host[method].apply(host, params);
    },
    introspect (host) {
      return IntrospectionUtils.introspect(host);
    }
  },
  proxy: {
    invoke (proxy, consumer: ServiceConsumer, method, params) {
      return consumer.invoke(method, params);
    }
  }
};
