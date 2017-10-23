import {ServiceRepresentation} from '../domain';

export class ServiceRepresentationChainModifier {
  representation: ServiceRepresentation;

  constructor(representation: ServiceRepresentation) {
    this.representation = representation;
  }

  /**
   * Modify service's name
   * @param serviceName
   * @return {ServiceRepresentationChainModifier}
   */
  name(serviceName): ServiceRepresentationChainModifier {
    this.representation.serviceName = serviceName;
    return this;
  }

  /**
   * Modify service's category
   * @param category
   * @return {ServiceRepresentationChainModifier}
   */
  category(category): ServiceRepresentationChainModifier {
    this.representation.category = category;
    return this;
  }

  /**
   * Modify service's config
   * @param configResolver
   * @return {ServiceRepresentationChainModifier}
   */
  config(configResolver): ServiceRepresentationChainModifier {
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
  dependency(servicesName): ServiceRepresentationChainModifier {
    this.representation.dependencies = this.representation.dependencies || [];
    if (Array.isArray(servicesName)) {
      this.representation.dependencies.push.apply(this.representation.dependencies, servicesName);
      return this;
    }
    this.representation.dependencies.push(servicesName);
    return this;
  }
}
