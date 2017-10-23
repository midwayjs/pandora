'use strict';
import {ServiceOptions} from '../domain';
import {SimpleServiceCore} from './SimpleServiceCore';
import {ProxyServiceCore} from './ProxyServiceCore';
import {AgentServiceCore} from './AgentServiceCore';

/**
 * Class ServiceCoreFactory
 * Produce a suitable ServiceCore
 */
export const ServiceCoreFactory: { new(options: ServiceOptions, ImplClass): SimpleServiceCore } = <any>
  function (options: ServiceOptions, ImplClass): SimpleServiceCore {
    if (ImplClass.getProxy && options.workMode === 'worker') {
      return new ProxyServiceCore(options, ImplClass);
    }
    if (ImplClass.getProxy && options.workMode === 'agent') {
      return new AgentServiceCore(options, ImplClass);
    }
    return new SimpleServiceCore(options, ImplClass);
  };

