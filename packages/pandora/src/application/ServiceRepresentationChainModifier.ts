import {ServiceRepresentation} from '../domain';
import {ServiceUtils} from '../service/ServiceUtils';
import {ProcfileReconciler} from './ProcfileReconciler';

export class ServiceRepresentationChainModifier {

  procfileReconciler: ProcfileReconciler;
  representation: ServiceRepresentation;

  constructor(representation: ServiceRepresentation, procfileReconciler: ProcfileReconciler) {
    this.representation = representation;
    this.procfileReconciler = procfileReconciler;
  }

  /**
   * Modify service's name
   * @param serviceName
   * @return {ServiceRepresentationChainModifier}
   */
  name(): string;
  name(serviceName): ServiceRepresentationChainModifier;
  name(serviceName?): any {
    if(!serviceName) {
      return this.representation.serviceName;
    }
    ServiceUtils.checkName(serviceName);
    this.representation.serviceName = serviceName;
    return this;
  }

  /**
   * Modify service's category
   * @param processName
   * @return {ServiceRepresentationChainModifier}
   */
  process(): string;
  process(processName): ServiceRepresentationChainModifier;
  process(processName?): any {
    if(!processName) {
      return this.representation.category;
    }
    this.representation.category = processName;
    return this;
  }

  /**
   * Modify service's config
   * @param configResolver
   * @return {ServiceRepresentationChainModifier}
   */
  config(): any;
  config(configResolver): ServiceRepresentationChainModifier;
  config(configResolver?): any {
    if(!configResolver) {
      return this.representation.config;
    }
    if ('function' === typeof configResolver) {
      this.representation.configResolver = configResolver;
      return this;
    }
    this.representation.config = configResolver;
    return this;
  }

  /**
   * modify service's dependencies
   * @param servicesName
   * @return {ServiceRepresentationChainModifier}
   */
  dependency(): string[];
  dependency(servicesName): ServiceRepresentationChainModifier;
  dependency(servicesName?): any {
    if(!servicesName) {
      return this.representation.dependencies;
    }
    this.representation.dependencies = this.representation.dependencies || [];
    if (Array.isArray(servicesName)) {
      this.representation.dependencies.push.apply(this.representation.dependencies, servicesName);
      return this;
    }
    this.representation.dependencies.push(servicesName);
    return this;
  }

  /**
   * Publish this service upon IPC-Hub
   * @param {boolean} enable
   */
  publish(enable: boolean = true) {
    this.representation.publishToHub = enable;
    return this;
  }

  /**
   * Drop this service like never happened
   */
  drop() {
    this.procfileReconciler.dropServiceByName(this.representation.serviceName);
  }

}
